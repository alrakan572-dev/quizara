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

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new GameEngineError(
      `${field} must be a boolean`,
      "INVALID_SETTING_VALUE",
    );
  }
  return value;
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

    const language = String(body?.language ?? "").trim().toLowerCase();
    const theme = String(body?.theme ?? "").trim().toLowerCase();

    if (language !== "ar" && language !== "en") {
      throw new GameEngineError(
        "language must be ar or en",
        "INVALID_LANGUAGE",
      );
    }

    if (theme !== "dark" && theme !== "light") {
      throw new GameEngineError(
        "theme must be dark or light",
        "INVALID_THEME",
      );
    }

    const notificationsEnabled = booleanValue(
      body?.notifications_enabled,
      "notifications_enabled",
    );
    const soundEnabled = booleanValue(
      body?.sound_enabled,
      "sound_enabled",
    );
    const musicEnabled = booleanValue(
      body?.music_enabled,
      "music_enabled",
    );

    const db = gameClient();

    const { data, error } = await db
      .from("users")
      .update({
        language,
        notifications_enabled: notificationsEnabled,
        sound_enabled: soundEnabled,
        music_enabled: musicEnabled,
        theme,
      })
      .eq("id", session.userId)
      .select(
        "language,notifications_enabled,sound_enabled,music_enabled,theme,delete_requested_at,delete_scheduled_for",
      )
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new GameEngineError("User was not found", "USER_NOT_FOUND");
    }

    return response({
      success: true,
      data: {
        preferences: {
          language: data.language,
          notifications_enabled: data.notifications_enabled,
          sound_enabled: data.sound_enabled,
          music_enabled: data.music_enabled,
          theme: data.theme,
        },
        account: {
          delete_requested_at: data.delete_requested_at,
          delete_scheduled_for: data.delete_scheduled_for,
          deletion_pending: Boolean(data.delete_scheduled_for),
        },
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
