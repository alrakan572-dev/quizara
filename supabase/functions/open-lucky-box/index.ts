import { requireTelegramSession } from "../_shared/telegram-auth/index.ts";
import { GameEngineError, gameClient, toGameEngineError } from "../_shared/game-engine/index.ts";

const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json" };
const reply = (body: unknown, status=200) => new Response(JSON.stringify(body), { status, headers });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parse(error: { message?: string; code?: string; details?: unknown; hint?: string }) {
  const message = String(error.message ?? "Lucky Box operation failed").trim();
  if (message.startsWith("LUCKY_BOX_COOLDOWN_ACTIVE:")) {
    const seconds = Math.max(Math.trunc(Number(message.split(":")[1] ?? 0) || 0), 0);
    return new GameEngineError("Lucky Box cooldown is still active", "LUCKY_BOX_COOLDOWN_ACTIVE", { remaining_seconds:seconds }, error.hint);
  }
  const codes = ["INVALID_AD_ATTEMPT_ID","AD_ATTEMPT_NOT_FOUND","AD_ATTEMPT_USER_MISMATCH","AD_ATTEMPT_INVALID_CONTEXT","AD_ATTEMPT_ALREADY_CONSUMED","AD_ATTEMPT_EXPIRED","AD_NOT_VERIFIED","USER_NOT_FOUND","INVALID_LUCKY_BOX_DAILY_LIMIT","INVALID_LUCKY_BOX_COOLDOWN","LUCKY_BOX_DAILY_LIMIT_REACHED","NO_ACTIVE_LUCKY_BOX_REWARDS","LUCKY_BOX_REWARD_SELECTION_FAILED","UNSUPPORTED_LUCKY_BOX_REWARD_TYPE"];
  for (const code of codes) if (message.includes(code)) return new GameEngineError(message, code, error.details, error.hint);
  return new GameEngineError(message, error.code ?? "LUCKY_BOX_RPC_ERROR", error.details, error.hint);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return reply({ success:false, error:{ code:"METHOD_NOT_ALLOWED", message:"Only POST requests are allowed" } }, 405);
  try {
    const session = await requireTelegramSession(req);
    const body = await req.json().catch(() => { throw new GameEngineError("Request body must be valid JSON", "INVALID_JSON_BODY"); });
    const attemptId = String(body?.ad_attempt_id ?? "").trim();
    if (!uuid.test(attemptId)) throw new GameEngineError("ad_attempt_id must be a valid UUID", "INVALID_AD_ATTEMPT_ID");
    const { data, error } = await gameClient().rpc("open_lucky_box", { p_user_id:session.userId, p_ad_attempt_id:attemptId });
    if (error) throw parse(error);
    return reply({ success:true, data });
  } catch (unknownError) {
    const error = toGameEngineError(unknownError);
    const status = ["SESSION_TOKEN_MISSING","SESSION_INVALID_OR_EXPIRED","SESSION_USER_NOT_FOUND"].includes(error.code) ? 401
      : ["USER_BLOCKED","LUCKY_BOX_DAILY_LIMIT_REACHED","LUCKY_BOX_COOLDOWN_ACTIVE"].includes(error.code) ? 403
      : ["AD_ATTEMPT_NOT_FOUND","USER_NOT_FOUND"].includes(error.code) ? 404
      : ["AD_ATTEMPT_ALREADY_CONSUMED","AD_ATTEMPT_EXPIRED","AD_NOT_VERIFIED"].includes(error.code) ? 409
      : ["INVALID_JSON_BODY","INVALID_AD_ATTEMPT_ID","AD_ATTEMPT_USER_MISMATCH","AD_ATTEMPT_INVALID_CONTEXT","INVALID_LUCKY_BOX_DAILY_LIMIT","INVALID_LUCKY_BOX_COOLDOWN","NO_ACTIVE_LUCKY_BOX_REWARDS","LUCKY_BOX_REWARD_SELECTION_FAILED","UNSUPPORTED_LUCKY_BOX_REWARD_TYPE"].includes(error.code) ? 400 : 500;
    return reply({ success:false, error:{ code:error.code, message:error.message, details:error.details ?? null, hint:error.hint ?? null } }, status);
  }
});
