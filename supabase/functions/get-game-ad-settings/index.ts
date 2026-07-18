import { requireTelegramSession } from "../_shared/telegram-auth/index.ts";
import { gameClient, toGameEngineError } from "../_shared/game-engine/index.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

function toBoolean(value: string | null | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
}

function toNumber(value: string | null | undefined, fallback: number, minimum = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(parsed, minimum) : fallback;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") {
    return response({ success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Only POST requests are allowed" } }, 405);
  }

  try {
    const session = await requireTelegramSession(req);
    await req.json().catch(() => ({}));

    const client = gameClient();
    const { data: user, error: userError } = await client
      .from("users")
      .select("vip")
      .eq("id", session.userId)
      .maybeSingle();

    if (userError) throw userError;

    const keys = [
      "game_ads_enabled",
      "game_ad_every_questions",
      "game_ad_frequency",
      "game_ad_capping_hours",
      "game_ad_interval_seconds",
      "game_ad_timeout_seconds",
      "game_ad_every_page",
      "ads_provider",
      "monetag_zone_id",
      "vip_remove_ads",
    ];

    const { data, error } = await client.from("settings").select("key,value").in("key", keys);
    if (error) throw error;

    const settings = Object.fromEntries((data ?? []).map((row) => [row.key, row.value])) as Record<string, string | null>;
    const vipRemovesAds = toBoolean(settings.vip_remove_ads, true);

    return response({
      success: true,
      data: {
        enabled: toBoolean(settings.game_ads_enabled, true) && !(Boolean(user?.vip) && vipRemovesAds),
        every_questions: Math.trunc(toNumber(settings.game_ad_every_questions, 3, 1)),
        provider: "monetag",
        zone_id: Math.trunc(toNumber(settings.monetag_zone_id, 11324128, 1)),
        frequency: Math.trunc(toNumber(settings.game_ad_frequency, 1, 1)),
        capping_hours: toNumber(settings.game_ad_capping_hours, 0.1, 0.1),
        interval_seconds: Math.trunc(toNumber(settings.game_ad_interval_seconds, 30, 0)),
        timeout_seconds: Math.trunc(toNumber(settings.game_ad_timeout_seconds, 0, 0)),
        every_page: toBoolean(settings.game_ad_every_page, false),
      },
    });
  } catch (error: unknown) {
    const gameError = toGameEngineError(error);
    const status = ["SESSION_TOKEN_MISSING", "SESSION_INVALID_OR_EXPIRED", "SESSION_USER_NOT_FOUND"].includes(gameError.code)
      ? 401
      : gameError.code === "USER_BLOCKED"
        ? 403
        : 500;

    return response({
      success: false,
      error: {
        code: gameError.code,
        message: gameError.message,
        details: gameError.details ?? null,
        hint: gameError.hint ?? null,
      },
    }, status);
  }
});
