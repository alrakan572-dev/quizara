import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { TelegramAuthError } from "./Errors.ts";
import type {
  TelegramAuthResponse,
  ValidatedTelegramInitData,
} from "./Types.ts";

const encoder = new TextEncoder();
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ACTIVE_SESSIONS = 5;

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL")?.trim();
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!url || !key) {
    throw new TelegramAuthError(
      "Supabase server credentials are missing",
      "SUPABASE_SERVER_CONFIGURATION_MISSING",
      500,
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function randomSessionToken(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

async function hashToBytea(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `\\x${hex}`;
}

export class SessionService {
  static async authenticate(params: {
    telegram: ValidatedTelegramInitData;
    userAgent: string | null;
    clientIp: string | null;
  }): Promise<TelegramAuthResponse> {
    const client = adminClient();
    const telegramUser = params.telegram.user;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

    const { data: user, error: userError } = await client
      .from("users")
      .upsert(
        {
          telegram_id: telegramUser.id,
          username: telegramUser.username ?? null,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name ?? null,
          language_code: telegramUser.language_code ?? null,
          telegram_is_premium: telegramUser.is_premium ?? false,
          photo_url: telegramUser.photo_url ?? null,
          last_login: now.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: "telegram_id" },
      )
      .select(
        "id,telegram_id,username,first_name,last_name,language_code,photo_url,telegram_is_premium,vip,points,coins,hints,extra_spins,level,is_blocked",
      )
      .single();

    if (userError) {
      throw new TelegramAuthError(
        userError.message,
        userError.code ?? "TELEGRAM_USER_UPSERT_FAILED",
        500,
        userError.details,
      );
    }

    if (user.is_blocked) {
      throw new TelegramAuthError(
        "This Quizara account is blocked",
        "USER_BLOCKED",
        403,
      );
    }

    const token = randomSessionToken();
    const tokenHash = await hashToBytea(token);
    const ipHash = params.clientIp ? await hashToBytea(params.clientIp) : null;

    const { error: sessionError } = await client
      .from("telegram_sessions")
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        telegram_auth_date: params.telegram.authDate.toISOString(),
        telegram_query_id: params.telegram.queryId,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        last_seen_at: now.toISOString(),
        user_agent: params.userAgent,
        ip_hash: ipHash,
      });

    if (sessionError) {
      throw new TelegramAuthError(
        sessionError.message,
        sessionError.code ?? "TELEGRAM_SESSION_CREATE_FAILED",
        500,
        sessionError.details,
      );
    }

    const { data: sessions } = await client
      .from("telegram_sessions")
      .select("id")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .gt("expires_at", now.toISOString())
      .order("created_at", { ascending: false });

    const excessIds = (sessions ?? [])
      .slice(MAX_ACTIVE_SESSIONS)
      .map((session) => session.id);

    if (excessIds.length > 0) {
      await client
        .from("telegram_sessions")
        .update({ revoked_at: now.toISOString() })
        .in("id", excessIds);
    }

    return {
      session_token: token,
      expires_at: expiresAt.toISOString(),
      user: {
        id: Number(user.id),
        telegram_id: Number(user.telegram_id),
        username: user.username ?? null,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        language_code: user.language_code ?? null,
        photo_url: user.photo_url ?? null,
        telegram_is_premium: Boolean(user.telegram_is_premium),
        vip: Boolean(user.vip),
        points: Number(user.points ?? 0),
        coins: Number(user.coins ?? 0),
        hints: Number(user.hints ?? 0),
        extra_spins: Number(user.extra_spins ?? 0),
        level: Number(user.level ?? 1),
      },
    };
  }
}
