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

function errorStatus(code: string): number {
  if (
    code === "SESSION_TOKEN_MISSING" ||
    code === "SESSION_INVALID_OR_EXPIRED" ||
    code === "SESSION_USER_NOT_FOUND"
  ) return 401;

  if (code === "USER_BLOCKED") return 403;
  if (code === "USER_NOT_FOUND") return 404;

  if (
    code === "INVALID_JSON_BODY" ||
    code === "INVALID_LANGUAGE" ||
    code === "INVALID_THEME" ||
    code === "INVALID_SETTING_VALUE" ||
    code === "INVALID_DELETE_DAYS"
  ) return 400;

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
    await req.json().catch(() => ({}));

    const { data, error } = await gameClient()
      .from("users")
      .update({
        delete_requested_at: null,
        delete_scheduled_for: null,
      })
      .eq("id", session.userId)
      .select("delete_requested_at,delete_scheduled_for")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new GameEngineError("User was not found", "USER_NOT_FOUND");
    }

    return response({
      success: true,
      data: {
        deletion_pending: false,
        delete_requested_at: null,
        delete_scheduled_for: null,
      },
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
    }, errorStatus(error.code));
  }
});
