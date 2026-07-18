import { TelegramAuthError } from "./Errors.ts";
import type { TelegramUser, ValidatedTelegramInitData } from "./Types.ts";

const encoder = new TextEncoder();

async function hmacSha256(key: Uint8Array, data: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  return new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data)),
  );
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function parseUser(value: string | null): TelegramUser {
  if (!value) {
    throw new TelegramAuthError(
      "Telegram initData does not contain a user",
      "TELEGRAM_USER_MISSING",
      401,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new TelegramAuthError(
      "Telegram user payload is invalid",
      "TELEGRAM_USER_INVALID",
      401,
    );
  }

  if (!parsed || typeof parsed !== "object") {
    throw new TelegramAuthError(
      "Telegram user payload is invalid",
      "TELEGRAM_USER_INVALID",
      401,
    );
  }

  const row = parsed as Record<string, unknown>;
  const id = Number(row.id);
  const firstName = String(row.first_name ?? "").trim();

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    !firstName ||
    row.is_bot === true
  ) {
    throw new TelegramAuthError(
      "Telegram user identity is invalid",
      "TELEGRAM_USER_INVALID",
      401,
    );
  }

  return {
    id,
    is_bot: false,
    first_name: firstName,
    last_name:
      typeof row.last_name === "string"
        ? row.last_name.trim() || undefined
        : undefined,
    username:
      typeof row.username === "string"
        ? row.username.trim() || undefined
        : undefined,
    language_code:
      typeof row.language_code === "string"
        ? row.language_code.trim() || undefined
        : undefined,
    is_premium: Boolean(row.is_premium),
    photo_url:
      typeof row.photo_url === "string"
        ? row.photo_url.trim() || undefined
        : undefined,
  };
}

export async function validateTelegramInitData(params: {
  initData: string;
  botToken: string;
  maxAgeSeconds?: number;
}): Promise<ValidatedTelegramInitData> {
  const initData = params.initData.trim();
  const botToken = params.botToken.trim();
  const maxAgeSeconds = params.maxAgeSeconds ?? 600;

  if (!initData) {
    throw new TelegramAuthError(
      "Telegram initData is required",
      "TELEGRAM_INIT_DATA_MISSING",
      400,
    );
  }

  if (!botToken) {
    throw new TelegramAuthError(
      "TELEGRAM_BOT_TOKEN is not configured",
      "TELEGRAM_BOT_TOKEN_MISSING",
      500,
    );
  }

  const searchParams = new URLSearchParams(initData);
  const receivedHash = searchParams.get("hash");

  if (!receivedHash || !/^[a-fA-F0-9]{64}$/.test(receivedHash)) {
    throw new TelegramAuthError(
      "Telegram hash is missing or invalid",
      "TELEGRAM_HASH_INVALID",
      401,
    );
  }

  const dataCheckString = Array.from(searchParams.entries())
    .filter(([key]) => key !== "hash")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = await hmacSha256(encoder.encode("WebAppData"), botToken);
  const expectedHash = toHex(await hmacSha256(secretKey, dataCheckString));

  if (
    !timingSafeEqual(expectedHash.toLowerCase(), receivedHash.toLowerCase())
  ) {
    throw new TelegramAuthError(
      "Telegram initData signature is invalid",
      "TELEGRAM_SIGNATURE_INVALID",
      401,
    );
  }

  const authDateSeconds = Number(searchParams.get("auth_date"));
  if (!Number.isSafeInteger(authDateSeconds) || authDateSeconds <= 0) {
    throw new TelegramAuthError(
      "Telegram auth_date is invalid",
      "TELEGRAM_AUTH_DATE_INVALID",
      401,
    );
  }

  const authDate = new Date(authDateSeconds * 1000);
  const ageSeconds = Math.floor((Date.now() - authDate.getTime()) / 1000);

  if (ageSeconds < -30 || ageSeconds > maxAgeSeconds) {
    throw new TelegramAuthError(
      "Telegram initData is expired or invalid",
      "TELEGRAM_INIT_DATA_EXPIRED",
      401,
      { age_seconds: ageSeconds, max_age_seconds: maxAgeSeconds },
    );
  }

  return {
    authDate,
    queryId: searchParams.get("query_id"),
    user: parseUser(searchParams.get("user")),
  };
}
