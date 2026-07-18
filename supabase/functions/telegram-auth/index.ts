import {
  SessionService,
  TelegramAuthError,
  toTelegramAuthError,
  validateTelegramInitData,
} from "../_shared/telegram-auth/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function clientIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    null
  );
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return response(
      {
        success: false,
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Only POST requests are allowed",
        },
      },
      405,
    );
  }

  try {
    const body = await request.json().catch(() => {
      throw new TelegramAuthError(
        "Request body must be valid JSON",
        "INVALID_JSON_BODY",
        400,
      );
    });

    const initData =
      typeof body?.init_data === "string" ? body.init_data : "";

    const telegram = await validateTelegramInitData({
      initData,
      botToken: Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "",
      maxAgeSeconds: 600,
    });

    const result = await SessionService.authenticate({
      telegram,
      userAgent: request.headers.get("user-agent"),
      clientIp: clientIp(request),
    });

    console.log(
      "TELEGRAM_AUTH_SUCCESS",
      JSON.stringify({
        user_id: result.user.id,
        telegram_id: result.user.telegram_id,
        expires_at: result.expires_at,
        timestamp: new Date().toISOString(),
      }),
    );

    return response({ success: true, data: result });
  } catch (unknownError) {
    const error = toTelegramAuthError(unknownError);

    console.error(
      "TELEGRAM_AUTH_EXCEPTION",
      JSON.stringify({
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      }),
    );

    return response(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      error.status,
    );
  }
});
