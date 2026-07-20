import { requireTelegramSession } from "../_shared/telegram-auth/index.ts";
import { toGameEngineError } from "../_shared/game-engine/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Only POST requests are allowed" } }, 405);

  try {
    await requireTelegramSession(req);
    return jsonResponse({
      success: false,
      error: {
        code: "VIP_ACTIVATION_SERVER_ONLY",
        message: "VIP activation requires a verified server-side payment or reward event.",
      },
    }, 403);
  } catch (error: unknown) {
    const gameError = toGameEngineError(error);
    const status = gameError.code === "USER_BLOCKED" ? 403 : 401;
    return jsonResponse({ success: false, error: { code: gameError.code, message: gameError.message, details: gameError.details ?? null, hint: gameError.hint ?? null } }, status);
  }
});
