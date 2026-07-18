import { requireTelegramSession } from "../_shared/telegram-auth/index.ts";
import { GameEngineError, gameClient, toGameEngineError } from "../_shared/game-engine/index.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

function optionalString(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new GameEngineError("Profile field must be a string or null", "INVALID_PROFILE_FIELD");
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) throw new GameEngineError(`Profile field exceeds ${maxLength} characters`, "PROFILE_FIELD_TOO_LONG");
  return normalized;
}

function statusFromCode(code: string): number {
  if (["SESSION_TOKEN_MISSING", "SESSION_INVALID_OR_EXPIRED", "SESSION_USER_NOT_FOUND"].includes(code)) return 401;
  if (code === "USER_BLOCKED") return 403;
  if (code === "USER_NOT_FOUND") return 404;
  if (["USERNAME_ALREADY_EXISTS", "23505"].includes(code)) return 409;
  if (["INVALID_JSON_BODY", "INVALID_PROFILE_FIELD", "PROFILE_FIELD_TOO_LONG", "INVALID_USERNAME", "INVALID_LANGUAGE", "INVALID_COUNTRY", "INVALID_PHOTO_URL", "23514"].includes(code)) return 400;
  return 500;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return response({ success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Only POST requests are allowed" } }, 405);

  try {
    const session = await requireTelegramSession(req);
    const body = await req.json().catch(() => { throw new GameEngineError("Request body must be valid JSON", "INVALID_JSON_BODY"); });

    const username = optionalString(body?.username, 24);
    const firstName = optionalString(body?.first_name, 64);
    const photoUrl = optionalString(body?.photo_url, 1000);
    const countryRaw = optionalString(body?.country, 2);
    const country = countryRaw ? countryRaw.toUpperCase() : null;
    const bio = optionalString(body?.bio, 160);
    const language = String(body?.language ?? "en").trim().toLowerCase();

    if (username && !/^[A-Za-z0-9_]{3,24}$/.test(username)) throw new GameEngineError("username must contain 3 to 24 letters, numbers, or underscores", "INVALID_USERNAME");
    if (language !== "ar" && language !== "en") throw new GameEngineError("language must be ar or en", "INVALID_LANGUAGE");
    if (country && !/^[A-Z]{2}$/.test(country)) throw new GameEngineError("country must be a two-letter uppercase ISO code", "INVALID_COUNTRY");

    if (photoUrl) {
      let parsed: URL | null = null;
      try { parsed = new URL(photoUrl); } catch { parsed = null; }
      if (!parsed || !["https:", "http:"].includes(parsed.protocol)) throw new GameEngineError("photo_url must be a valid HTTP or HTTPS URL", "INVALID_PHOTO_URL");
    }

    const db = gameClient();

    if (username) {
      const { data: existing, error: lookupError } = await db.from("users").select("id").ilike("username", username).neq("id", session.userId).limit(1);
      if (lookupError) throw lookupError;
      if (existing && existing.length > 0) throw new GameEngineError("This username is already in use", "USERNAME_ALREADY_EXISTS");
    }

    const { data, error } = await db.from("users")
      .update({ username, first_name: firstName, photo_url: photoUrl, country, language, bio })
      .eq("id", session.userId)
      .select("id,telegram_id,username,first_name,photo_url,country,language,bio,points,coins,hints,extra_spins,level,games_played,total_correct,total_wrong,vip,created_at,updated_at")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") throw new GameEngineError("This username is already in use", "USERNAME_ALREADY_EXISTS", error.details, error.hint);
      throw error;
    }
    if (!data) throw new GameEngineError("User was not found", "USER_NOT_FOUND");

    const { error: leaderboardError } = await db.from("leaderboard")
      .update({ username: data.username, photo_url: data.photo_url })
      .eq("telegram_id", data.telegram_id);

    if (leaderboardError) console.warn("PROFILE_LEADERBOARD_SYNC_WARNING", leaderboardError);

    return response({ success: true, data });
  } catch (unknownError) {
    const error = toGameEngineError(unknownError);
    return response({ success: false, error: { code: error.code, message: error.message, details: error.details ?? null, hint: error.hint ?? null } }, statusFromCode(error.code));
  }
});
