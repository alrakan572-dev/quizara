import { requireAdminSession } from "../_shared/admin-auth/index.ts";
import { GameEngineError, gameClient, toGameEngineError } from "../_shared/game-engine/index.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const allowedKeys = new Set(["maintenance_mode", "support_username", "telegram_bot_username", "ads_every_questions"]);

function normalize(key: string, value: unknown): string {
  if (key === "maintenance_mode") {
    if (typeof value !== "boolean") throw new GameEngineError("maintenance_mode must be boolean", "INVALID_SETTING_VALUE");
    return String(value);
  }
  if (key === "ads_every_questions") {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) throw new GameEngineError("ads_every_questions must be an integer from 1 to 20", "INVALID_SETTING_VALUE");
    return String(parsed);
  }
  const text = String(value ?? "").trim();
  if (text.length > 100) throw new GameEngineError(`${key} is too long`, "INVALID_SETTING_VALUE");
  return text;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return response({ success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Only POST requests are allowed" } }, 405);
  try {
    const admin = await requireAdminSession(req);
    const body = await req.json().catch(() => { throw new GameEngineError("Request body must be valid JSON", "INVALID_JSON_BODY"); });
    const updates = body?.settings;
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) throw new GameEngineError("settings must be an object", "INVALID_SETTINGS");

    const rows = Object.entries(updates).map(([key, value]) => {
      if (!allowedKeys.has(key)) throw new GameEngineError(`Setting ${key} cannot be changed here`, "SETTING_NOT_ALLOWED");
      return { key, value: normalize(key, value) };
    });
    if (rows.length === 0 || rows.length > allowedKeys.size) throw new GameEngineError("No valid settings supplied", "INVALID_SETTINGS");

    const db = gameClient();
    const { error } = await db.from("settings").upsert(rows, { onConflict: "key" });
    if (error) throw error;
    const { error: auditError } = await db.from("admin_audit_log").insert({ admin_user_id: admin.userId, action: "settings.update", entity_type: "settings", metadata: { keys: rows.map((row) => row.key) } });
    if (auditError) throw auditError;

    return response({ success: true, data: { settings: Object.fromEntries(rows.map((row) => [row.key, row.value])), updated_at: new Date().toISOString() } });
  } catch (unknownError) {
    const error = toGameEngineError(unknownError);
    const status = error.code === "ADMIN_ACCESS_DENIED" || error.code === "ADMIN_ROLE_INVALID" ? 403 : error.code.startsWith("SESSION_") ? 401 : ["INVALID_JSON_BODY","INVALID_SETTINGS","INVALID_SETTING_VALUE","SETTING_NOT_ALLOWED"].includes(error.code) ? 400 : 500;
    return response({ success: false, error: { code: error.code, message: error.message, details: error.details ?? null } }, status);
  }
});
