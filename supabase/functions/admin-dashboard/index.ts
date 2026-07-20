import { requireAdminSession } from "../_shared/admin-auth/index.ts";
import { gameClient, toGameEngineError } from "../_shared/game-engine/index.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

async function countRows(table: string, filters?: (query: any) => any): Promise<number> {
  let query = gameClient().from(table).select("id", { count: "exact", head: true });
  if (filters) query = filters(query);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return response({ success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Only POST requests are allowed" } }, 405);

  try {
    const admin = await requireAdminSession(req);
    await req.json().catch(() => ({}));
    const db = gameClient();
    const now = new Date();
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();

    const [users, newUsersToday, blockedUsers, questions, riddles, images, activeVip, settingsResult, recentUsersResult] = await Promise.all([
      countRows("users"),
      countRows("users", (q) => q.gte("created_at", dayStart)),
      countRows("users", (q) => q.eq("is_blocked", true)),
      countRows("questions"),
      countRows("riddles"),
      countRows("find_the_difference"),
      countRows("vip_subscriptions", (q) => q.eq("active", true).gt("expire_date", now.toISOString())),
      db.from("settings").select("key,value").in("key", ["app_name","app_version","maintenance_mode","telegram_bot_username","support_username","ads_every_questions"]),
      db.from("users").select("id,telegram_id,username,first_name,points,level,vip,is_blocked,created_at").order("created_at", { ascending: false }).limit(10),
    ]);

    if (settingsResult.error) throw settingsResult.error;
    if (recentUsersResult.error) throw recentUsersResult.error;

    return response({ success: true, data: {
      admin: { user_id: admin.userId, role: admin.role },
      metrics: { users, new_users_today: newUsersToday, blocked_users: blockedUsers, questions, riddles, find_difference: images, active_vip: activeVip },
      settings: Object.fromEntries((settingsResult.data ?? []).map((row: any) => [row.key, row.value])),
      recent_users: recentUsersResult.data ?? [],
      generated_at: now.toISOString(),
    }});
  } catch (unknownError) {
    const error = toGameEngineError(unknownError);
    const status = error.code === "ADMIN_ACCESS_DENIED" || error.code === "ADMIN_ROLE_INVALID" ? 403 : error.code.startsWith("SESSION_") ? 401 : 500;
    return response({ success: false, error: { code: error.code, message: error.message, details: error.details ?? null } }, status);
  }
});
