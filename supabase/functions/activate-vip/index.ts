import { requireTelegramSession } from "../_shared/telegram-auth/index.ts";
import {
  GameEngineError,
  gameClient,
  toGameEngineError,
} from "../_shared/game-engine/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const allowedSources = new Set([
  "telegram_stars",
  "lucky_box",
  "admin",
  "promo",
]);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function statusFromCode(code: string): number {
  if (
    code === "SESSION_TOKEN_MISSING" ||
    code === "SESSION_INVALID_OR_EXPIRED" ||
    code === "SESSION_USER_NOT_FOUND"
  )
    return 401;
  if (code === "USER_BLOCKED") return 403;
  const badRequestCodes = new Set([
    "INVALID_JSON_BODY",
    "INVALID_USER_ID",
    "INVALID_VIP_PLAN_ID",
    "INVALID_VIP_SOURCE",
    "INVALID_ACTIVATION_KEY",
    "INVALID_METADATA",
    "INVALID_VIP_PLAN_DURATION",
  ]);

  const conflictCodes = new Set(["ACTIVATION_KEY_CONFLICT", "23505"]);

  if (badRequestCodes.has(code)) return 400;
  if (code === "USER_NOT_FOUND") return 404;
  if (code === "VIP_PLAN_NOT_FOUND") return 404;
  if (conflictCodes.has(code)) return 409;

  return 500;
}

function parseRpcError(error: {
  message?: string;
  code?: string;
  details?: unknown;
  hint?: string;
}): GameEngineError {
  const rawMessage = String(error.message ?? "VIP activation failed").trim();

  const knownCodes = [
    "INVALID_USER_ID",
    "INVALID_VIP_PLAN_ID",
    "INVALID_VIP_SOURCE",
    "INVALID_ACTIVATION_KEY",
    "ACTIVATION_KEY_CONFLICT",
    "USER_NOT_FOUND",
    "VIP_PLAN_NOT_FOUND",
    "INVALID_VIP_PLAN_DURATION",
  ];

  for (const code of knownCodes) {
    if (rawMessage.includes(code)) {
      return new GameEngineError(rawMessage, code, error.details, error.hint);
    }
  }

  return new GameEngineError(
    rawMessage,
    error.code ?? "ACTIVATE_VIP_RPC_ERROR",
    error.details,
    error.hint,
  );
}

function validateMetadata(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new GameEngineError(
      "metadata must be a JSON object",
      "INVALID_METADATA",
    );
  }

  const metadata = value as Record<string, unknown>;
  const encoded = JSON.stringify(metadata);

  if (encoded.length > 10_000) {
    throw new GameEngineError("metadata is too large", "INVALID_METADATA");
  }

  return metadata;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Only POST requests are allowed",
        },
      },
      405,
    );
  }

  try {
    const session = await requireTelegramSession(req);
    const userId = session.userId;

    const rawBody = await req.json().catch(() => {
      throw new GameEngineError(
        "Request body must be valid JSON",
        "INVALID_JSON_BODY",
      );
    });
    const planId = Number(rawBody?.plan_id);

    const source = String(rawBody?.source ?? "")
      .trim()
      .toLowerCase();

    const activationKey = String(rawBody?.activation_key ?? "").trim();

    const metadata = validateMetadata(rawBody?.metadata);

    if (!Number.isSafeInteger(planId) || planId <= 0) {
      throw new GameEngineError(
        "plan_id must be a positive integer",
        "INVALID_VIP_PLAN_ID",
      );
    }

    if (!allowedSources.has(source)) {
      throw new GameEngineError(
        "Invalid VIP activation source",
        "INVALID_VIP_SOURCE",
        {
          allowed_sources: Array.from(allowedSources),
        },
      );
    }

    if (activationKey.length < 8 || activationKey.length > 200) {
      throw new GameEngineError(
        "activation_key must contain between 8 and 200 characters",
        "INVALID_ACTIVATION_KEY",
      );
    }

    const { data, error } = await gameClient().rpc("activate_vip", {
      p_user_id: userId,
      p_plan_id: planId,
      p_source: source,
      p_activation_key: activationKey,
      p_metadata: metadata,
    });

    if (error) {
      throw parseRpcError(error);
    }

    console.log(
      "ACTIVATE_VIP_SUCCESS",
      JSON.stringify({
        user_id: userId,
        plan_id: planId,
        source,
        subscription_id:
          data?.subscription?.id ?? data?.subscription_id ?? null,
        idempotent: data?.idempotent ?? false,
        expire_date:
          data?.subscription?.expire_date ??
          data?.expire_date ??
          data?.new_expire_date ??
          null,
        timestamp: new Date().toISOString(),
      }),
    );

    return jsonResponse(
      {
        success: true,
        data,
      },
      200,
    );
  } catch (error: unknown) {
    const gameError = toGameEngineError(error);

    console.error(
      "ACTIVATE_VIP_EXCEPTION",
      JSON.stringify({
        code: gameError.code,
        message: gameError.message,
        details: gameError.details ?? null,
        hint: gameError.hint ?? null,
        stack: error instanceof Error ? error.stack : null,
        timestamp: new Date().toISOString(),
      }),
    );

    return jsonResponse(
      {
        success: false,
        error: {
          code: gameError.code,
          message: gameError.message,
          details: gameError.details ?? null,
          hint: gameError.hint ?? null,
        },
      },
      statusFromCode(gameError.code),
    );
  }
});
