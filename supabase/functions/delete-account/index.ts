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

    const db = gameClient();

    const { data: setting, error: settingError } = await db
      .from("settings")
      .select("value")
      .eq("key", "account_delete_days")
      .maybeSingle();

    if (settingError) throw settingError;

    const deleteDays = Number(setting?.value ?? 30);

    if (
      !Number.isSafeInteger(deleteDays) ||
      deleteDays < 1 ||
      deleteDays > 365
    ) {
      throw new GameEngineError(
        "account_delete_days must be between 1 and 365",
        "INVALID_DELETE_DAYS",
      );
    }

    const requestedAt = new Date();
    const scheduledFor = new Date(
      requestedAt.getTime() + deleteDays * 24 * 60 * 60 * 1000,
    );

    const { data, error } = await db
      .from("users")
      .update({
        delete_requested_at: requestedAt.toISOString(),
        delete_scheduled_for: scheduledFor.toISOString(),
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
        deletion_pending: true,
        delete_requested_at: data.delete_requested_at,
        delete_scheduled_for: data.delete_scheduled_for,
        grace_period_days: deleteDays,
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
