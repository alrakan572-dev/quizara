import { requireTelegramSession } from "../_shared/telegram-auth/index.ts";
import { GameEngineError, gameClient, toGameEngineError } from "../_shared/game-engine/index.ts";

const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json" };
const reply = (body: unknown, status=200) => new Response(JSON.stringify(body), { status, headers });

function parse(error: { message?: string; code?: string; details?: unknown; hint?: string }) {
  const message = String(error.message ?? "Unable to create ad attempt").trim();
  if (message.startsWith("LUCKY_BOX_COOLDOWN_ACTIVE:")) {
    const seconds = Math.max(Math.trunc(Number(message.split(":")[1] ?? 0) || 0), 0);
    return new GameEngineError("Lucky Box cooldown is still active", "LUCKY_BOX_COOLDOWN_ACTIVE", { remaining_seconds: seconds }, error.hint);
  }
  for (const code of ["USER_NOT_FOUND","INVALID_LUCKY_BOX_DAILY_LIMIT","INVALID_LUCKY_BOX_COOLDOWN","LUCKY_BOX_DAILY_LIMIT_REACHED"]) {
    if (message.includes(code)) return new GameEngineError(message, code, error.details, error.hint);
  }
  return new GameEngineError(message, error.code ?? "CREATE_AD_ATTEMPT_RPC_ERROR", error.details, error.hint);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return reply({ success:false, error:{ code:"METHOD_NOT_ALLOWED", message:"Only POST requests are allowed" } }, 405);
  try {
    const session = await requireTelegramSession(req);
    const { data, error } = await gameClient().rpc("create_monetag_lucky_box_attempt", { p_user_id: session.userId });
    if (error) throw parse(error);
    return reply({ success:true, data });
  } catch (unknownError) {
    const error = toGameEngineError(unknownError);
    const status = ["SESSION_TOKEN_MISSING","SESSION_INVALID_OR_EXPIRED","SESSION_USER_NOT_FOUND"].includes(error.code) ? 401
      : error.code === "USER_BLOCKED" ? 403
      : ["LUCKY_BOX_DAILY_LIMIT_REACHED","LUCKY_BOX_COOLDOWN_ACTIVE"].includes(error.code) ? 403
      : error.code === "USER_NOT_FOUND" ? 404
      : ["INVALID_LUCKY_BOX_DAILY_LIMIT","INVALID_LUCKY_BOX_COOLDOWN"].includes(error.code) ? 400 : 500;
    return reply({ success:false, error:{ code:error.code, message:error.message, details:error.details ?? null, hint:error.hint ?? null } }, status);
  }
});
