import { requireTelegramSession } from "../_shared/telegram-auth/index.ts";
import {
  GameEngineError,
  LeaderboardService,
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
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function statusFromCode(code: string): number {
  if (
    code === "SESSION_TOKEN_MISSING" ||
    code === "SESSION_INVALID_OR_EXPIRED" ||
    code === "SESSION_USER_NOT_FOUND"
  )
    return 401;
  if (code === "USER_BLOCKED") return 403;
  if (
    code === "INVALID_USER_ID" ||
    code === "INVALID_LIMIT" ||
    code === "INVALID_OFFSET"
  ) {
    return 400;
  }

  if (code === "PGRST116" || code === "USER_NOT_FOUND") {
    return 404;
  }

  return 500;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
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
    const session = await requireTelegramSession(req);
    const userId = session.userId;

    const rawBody = await req.json().catch(() => {
      throw new GameEngineError(
        "Request body must be valid JSON",
        "INVALID_JSON_BODY",
      );
    });

    const data = await LeaderboardService.getLeaderboard({
      userId,
      limit: rawBody?.limit === undefined ? 20 : Number(rawBody.limit),
      offset: rawBody?.offset === undefined ? 0 : Number(rawBody.offset),
    });

    console.log(
      "GET_LEADERBOARD_SUCCESS",
      JSON.stringify({
        user_id: userId,
        limit: data.pagination.limit,
        offset: data.pagination.offset,
        returned: data.leaders.length,
      }),
    );

    return jsonResponse(
      {
        success: true,
        data,
      },
      200,
    );
  } catch (error: unknown) {
    const gameError = toGameEngineError(error);

    console.error(
      "GET_LEADERBOARD_EXCEPTION",
      JSON.stringify({
        code: gameError.code,
        message: gameError.message,
        details: gameError.details ?? null,
        hint: gameError.hint ?? null,
        stack: error instanceof Error ? error.stack : null,
        timestamp: new Date().toISOString(),
      }),
    );

    return jsonResponse(
      {
        success: false,
        error: {
          code: gameError.code,
          message: gameError.message,
          details: gameError.details ?? null,
          hint: gameError.hint ?? null,
        },
      },
      statusFromCode(gameError.code),
    );
  }
});
