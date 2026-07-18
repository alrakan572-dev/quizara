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
  if (code === "INVALID_JSON_BODY" || code === "INVALID_USER_ID") {
    return 400;
  }

  if (code === "USER_NOT_FOUND" || code === "PGRST116") {
    return 404;
  }

  return 500;
}

function parseRpcError(error: {
  message?: string;
  code?: string;
  details?: unknown;
  hint?: string;
}): GameEngineError {
  const message = String(error.message ?? "VIP status operation failed");

  if (message.includes("INVALID_USER_ID")) {
    return new GameEngineError(
      "user_id must be a positive integer",
      "INVALID_USER_ID",
      error.details,
      error.hint,
    );
  }

  if (message.includes("USER_NOT_FOUND")) {
    return new GameEngineError(
      "User was not found",
      "USER_NOT_FOUND",
      error.details,
      error.hint,
    );
  }

  return new GameEngineError(
    message,
    error.code ?? "GET_VIP_STATUS_RPC_ERROR",
    error.details,
    error.hint,
  );
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

    const { data, error } = await gameClient().rpc("get_vip_status", {
      p_user_id: userId,
    });

    if (error) {
      throw parseRpcError(error);
    }

    console.log(
      "GET_VIP_STATUS_SUCCESS",
      JSON.stringify({
        user_id: userId,
        vip: data?.vip ?? false,
        subscription_id: data?.subscription?.id ?? null,
        plan_id: data?.plan?.id ?? null,
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
      "GET_VIP_STATUS_EXCEPTION",
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
