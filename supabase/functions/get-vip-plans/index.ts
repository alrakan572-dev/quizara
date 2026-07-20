import { requireTelegramSession } from "../_shared/telegram-auth/index.ts";
import {
  GameEngineError,
  gameClient,
  toGameEngineError,
} from "../_shared/game-engine/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function statusFromCode(code: string): number {
  if (
    code === "SESSION_TOKEN_MISSING" ||
    code === "SESSION_INVALID_OR_EXPIRED" ||
    code === "SESSION_USER_NOT_FOUND"
  ) return 401;
  if (code === "USER_BLOCKED") return 403;
  return 500;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Only POST requests are allowed" } }, 405);
  }

  try {
    await requireTelegramSession(req);

    const { data, error } = await gameClient()
      .from("vip_plans")
      .select("id,plan_name,duration_days,price,unlimited_games,ads_enabled,lucky_boxes_per_day,bonus_points_percent,vip_badge,description,active")
      .eq("active", true)
      .order("duration_days", { ascending: true });

    if (error) {
      throw new GameEngineError(error.message, error.code ?? "VIP_PLANS_QUERY_FAILED", error.details, error.hint);
    }

    const plans = (data ?? []).map((row) => ({
      id: Number(row.id),
      name: String(row.plan_name ?? "VIP"),
      duration_days: Number(row.duration_days ?? 0),
      price: Number(row.price ?? 0),
      unlimited_games: Boolean(row.unlimited_games),
      ads_enabled: Boolean(row.ads_enabled),
      lucky_boxes_per_day: Number(row.lucky_boxes_per_day ?? 0),
      bonus_points_percent: Number(row.bonus_points_percent ?? 0),
      vip_badge: Boolean(row.vip_badge),
      description: row.description == null ? null : String(row.description),
    }));

    return jsonResponse({ success: true, data: { plans } });
  } catch (error: unknown) {
    const gameError = toGameEngineError(error);
    return jsonResponse({ success: false, error: { code: gameError.code, message: gameError.message, details: gameError.details ?? null, hint: gameError.hint ?? null } }, statusFromCode(gameError.code));
  }
});
