import { requireTelegramSession } from "../_shared/telegram-auth/index.ts";
import { GameEngineError, gameClient, toGameEngineError } from "../_shared/game-engine/index.ts";

const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json" };
const reply = (body: unknown, status=200) => new Response(JSON.stringify(body), { status, headers });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return reply({ success:false, error:{ code:"METHOD_NOT_ALLOWED", message:"Only POST requests are allowed" } }, 405);
  try {
    const session = await requireTelegramSession(req);
    const body = await req.json().catch(() => { throw new GameEngineError("Request body must be valid JSON", "INVALID_JSON_BODY"); });
    const attemptId = String(body?.attempt_id ?? "").trim();
    if (!uuid.test(attemptId)) throw new GameEngineError("attempt_id must be a valid UUID", "INVALID_AD_ATTEMPT_ID");

    const client = gameClient();
    const now = new Date().toISOString();
    await client.from("monetag_ad_attempts").update({ status:"expired" }).eq("id", attemptId).eq("user_id", session.userId).eq("status", "pending").lte("expires_at", now);
    const { data, error } = await client.from("monetag_ad_attempts").select("id,status,expires_at,verified_at,consumed_at").eq("id", attemptId).eq("user_id", session.userId).maybeSingle();
    if (error) throw error;
    if (!data) throw new GameEngineError("Ad attempt was not found", "AD_ATTEMPT_NOT_FOUND");
    return reply({ success:true, data:{ attempt_id:data.id, status:data.status, verified:data.status === "valued" && Boolean(data.verified_at), consumed:data.status === "consumed" || Boolean(data.consumed_at), expires_at:data.expires_at } });
  } catch (unknownError) {
    const error = toGameEngineError(unknownError);
    const status = ["SESSION_TOKEN_MISSING","SESSION_INVALID_OR_EXPIRED","SESSION_USER_NOT_FOUND"].includes(error.code) ? 401
      : error.code === "USER_BLOCKED" ? 403
      : error.code === "AD_ATTEMPT_NOT_FOUND" ? 404
      : ["INVALID_JSON_BODY","INVALID_AD_ATTEMPT_ID"].includes(error.code) ? 400 : 500;
    return reply({ success:false, error:{ code:error.code, message:error.message, details:error.details ?? null, hint:error.hint ?? null } }, status);
  }
});
