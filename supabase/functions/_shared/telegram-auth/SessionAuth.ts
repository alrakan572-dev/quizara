import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { TelegramAuthError } from "./Errors.ts";
import type { AuthenticatedSession } from "./Types.ts";

const encoder = new TextEncoder();

async function tokenHash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `\\x${hex}`;
}

export async function requireTelegramSession(
  request: Request,
): Promise<AuthenticatedSession> {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const token = /^Bearer\s+(.+)$/i.exec(authorization)?.[1]?.trim() ?? "";

  if (token.length < 40 || token.length > 200) {
    throw new TelegramAuthError(
      "A valid Quizara session token is required",
      "SESSION_TOKEN_MISSING",
      401,
    );
  }

  const url = Deno.env.get("SUPABASE_URL")?.trim();
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!url || !key) {
    throw new TelegramAuthError(
      "Supabase server credentials are missing",
      "SUPABASE_SERVER_CONFIGURATION_MISSING",
      500,
    );
  }

  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const now = new Date().toISOString();

  const { data, error } = await client
    .from("telegram_sessions")
    .select(
      "id,user_id,expires_at,users!inner(id,telegram_id,username,first_name,last_name,language_code,photo_url,vip,is_blocked)",
    )
    .eq("token_hash", await tokenHash(token))
    .is("revoked_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (error) {
    throw new TelegramAuthError(
      error.message,
      error.code ?? "SESSION_LOOKUP_FAILED",
      500,
      error.details,
    );
  }

  if (!data) {
    throw new TelegramAuthError(
      "Quizara session is invalid or expired",
      "SESSION_INVALID_OR_EXPIRED",
      401,
    );
  }

  const user = Array.isArray(data.users) ? data.users[0] : data.users;

  if (!user || user.is_blocked) {
    throw new TelegramAuthError(
      "The session user is unavailable",
      user?.is_blocked ? "USER_BLOCKED" : "SESSION_USER_NOT_FOUND",
      user?.is_blocked ? 403 : 401,
    );
  }

  await client
    .from("telegram_sessions")
    .update({ last_seen_at: now })
    .eq("id", data.id);

  return {
    sessionId: String(data.id),
    userId: Number(user.id),
    telegramId: Number(user.telegram_id),
    username: user.username ?? null,
    firstName: user.first_name ?? null,
    lastName: user.last_name ?? null,
    languageCode: user.language_code ?? null,
    photoUrl: user.photo_url ?? null,
    vip: Boolean(user.vip),
    expiresAt: String(data.expires_at),
  };
}
