import {
  requireTelegramSession,
} from "../_shared/telegram-auth/index.ts";
import {
  GameEngineError,
  gameClient,
  toGameEngineError,
} from "../_shared/game-engine/index.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

function statusFromCode(code: string): number {
  if (
    code === "SESSION_TOKEN_MISSING" ||
    code === "SESSION_INVALID_OR_EXPIRED" ||
    code === "SESSION_USER_NOT_FOUND"
  ) return 401;

  if (code === "USER_BLOCKED") return 403;

  if (
    code === "INVALID_JSON_BODY" ||
    code === "INVALID_REFERRAL_CODE" ||
    code === "INVALID_INVITER_REWARD" ||
    code === "INVALID_INVITED_REWARD"
  ) return 400;

  if (
    code === "USER_NOT_FOUND" ||
    code === "INVITER_NOT_FOUND" ||
    code === "REFERRAL_CODE_NOT_FOUND"
  ) return 404;

  if (
    code === "SELF_REFERRAL_NOT_ALLOWED" ||
    code === "REFERRAL_ALREADY_CLAIMED" ||
    code === "23505"
  ) return 409;

  return 500;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  if (req.method !== "POST") {
    return response({
      success: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Only POST requests are allowed",
      },
    }, 405);
  }

  try {
    const session = await requireTelegramSession(req);

    const body = await req.json().catch(() => {
      throw new GameEngineError(
        "Request body must be valid JSON",
        "INVALID_JSON_BODY",
      );
    });

    const referralCode = String(
      body?.referral_code ?? "",
    )
      .trim()
      .toUpperCase();

    if (!/^QZ[A-Z0-9]{4,10}$/.test(referralCode)) {
      throw new GameEngineError(
        "referral_code is invalid",
        "INVALID_REFERRAL_CODE",
      );
    }

    const { data, error } = await gameClient().rpc(
      "claim_referral_reward",
      {
        p_invited_user_id: session.userId,
        p_referral_code: referralCode,
      },
    );

    if (error) throw error;

    return response({
      success: true,
      data,
    });
  } catch (unknownError) {
    const error = toGameEngineError(unknownError);

    return response({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
        hint: error.hint ?? null,
      },
    }, statusFromCode(error.code));
  }
});
