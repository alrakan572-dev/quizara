import type { GameType } from "../core/GameTypes.ts";
import { GameEngineError } from "../core/GameErrors.ts";

export type GameTokenPayload = {
  user_id: number;
  type: GameType;
  item_id: number;
  issued_at: number;
  expires_at: number;
  nonce: string;
};

function getSecret(): string {
  const secret = Deno.env.get("GAME_TOKEN_SECRET");

  if (!secret || secret.length < 32) {
    throw new GameEngineError(
      "GAME_TOKEN_SECRET must contain at least 32 characters",
      "MISSING_GAME_TOKEN_SECRET",
    );
  }

  return secret;
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded = normalized.padEnd(
    Math.ceil(normalized.length / 4) * 4,
    "=",
  );

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function getSigningKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"],
  );
}

function secureEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < left.length; index++) {
    difference |= left[index] ^ right[index];
  }

  return difference === 0;
}

export class GameTokenService {
  static async create(params: {
    user_id: number;
    type: GameType;
    item_id: number;
    lifetime_seconds?: number;
  }): Promise<{
    token: string;
    expires_at: number;
  }> {
    const now = Date.now();
    const lifetimeSeconds = Math.min(
      Math.max(params.lifetime_seconds ?? 300, 30),
      900,
    );

    const payload: GameTokenPayload = {
      user_id: params.user_id,
      type: params.type,
      item_id: params.item_id,
      issued_at: now,
      expires_at: now + lifetimeSeconds * 1000,
      nonce: crypto.randomUUID(),
    };

    const encodedPayload = encodeBase64Url(
      new TextEncoder().encode(JSON.stringify(payload)),
    );

    const key = await getSigningKey();

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(encodedPayload),
    );

    const signature = encodeBase64Url(
      new Uint8Array(signatureBuffer),
    );

    return {
      token: `${encodedPayload}.${signature}`,
      expires_at: payload.expires_at,
    };
  }

  static async verify(token: string): Promise<GameTokenPayload> {
    if (!token || typeof token !== "string") {
      throw new GameEngineError(
        "Missing game token",
        "MISSING_GAME_TOKEN",
      );
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      throw new GameEngineError(
        "Invalid game token",
        "INVALID_GAME_TOKEN",
      );
    }

    const [encodedPayload, encodedSignature] = parts;

    let suppliedSignature: Uint8Array;

    try {
      suppliedSignature = decodeBase64Url(encodedSignature);
    } catch {
      throw new GameEngineError(
        "Invalid game token signature",
        "INVALID_GAME_TOKEN",
      );
    }

    const key = await getSigningKey();

    const expectedSignatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(encodedPayload),
    );

    const expectedSignature = new Uint8Array(
      expectedSignatureBuffer,
    );

    if (!secureEqual(expectedSignature, suppliedSignature)) {
      throw new GameEngineError(
        "Invalid game token signature",
        "INVALID_GAME_TOKEN",
      );
    }

    let payload: GameTokenPayload;

    try {
      payload = JSON.parse(
        new TextDecoder().decode(
          decodeBase64Url(encodedPayload),
        ),
      );
    } catch {
      throw new GameEngineError(
        "Invalid game token payload",
        "INVALID_GAME_TOKEN",
      );
    }

    if (
      !Number.isSafeInteger(payload.user_id) ||
      !Number.isSafeInteger(payload.item_id) ||
      !payload.type ||
      !Number.isFinite(payload.issued_at) ||
      !Number.isFinite(payload.expires_at) ||
      !payload.nonce
    ) {
      throw new GameEngineError(
        "Invalid game token payload",
        "INVALID_GAME_TOKEN",
      );
    }

    if (Date.now() > payload.expires_at) {
      throw new GameEngineError(
        "Game token expired",
        "GAME_TOKEN_EXPIRED",
      );
    }

    return payload;
  }
}