import { requireTelegramSession } from "../_shared/telegram-auth/index.ts";
import {
  AntiCheatService,
  GameEngine,
  GameEngineError,
  GameTokenService,
  GetNextGameService,
  ValidationService,
  type GetNextGameInput,
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

function statusFromErrorCode(code: string): number {
  if (
    code === "SESSION_TOKEN_MISSING" ||
    code === "SESSION_INVALID_OR_EXPIRED" ||
    code === "SESSION_USER_NOT_FOUND"
  )
    return 401;
  if (code === "USER_BLOCKED") return 403;
  if (
    code === "INVALID_USER_ID" ||
    code === "INVALID_GAME_TYPE" ||
    code === "INVALID_LANGUAGE" ||
    code === "INVALID_DIFFICULTY" ||
    code === "INVALID_CATEGORY" ||
    code === "VALIDATION_ERROR"
  ) {
    return 400;
  }

  if (code === "USER_NOT_FOUND") {
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

    const input = ValidationService.getNextGame({
      user_id: userId,
      type: rawBody?.type,
      language: rawBody?.language,
      category: rawBody?.category,
      difficulty: rawBody?.difficulty,
    } as GetNextGameInput);

    const result = await GameEngine.getNextGame(
      input,
      async (validatedInput) => {
        const game = await GetNextGameService.execute(validatedInput);

        if (game.empty || !game.item) {
          return {
            type: validatedInput.type,
            item: null,
            empty: true,
            completed: game.exhausted === true,
            message: game.message,
          };
        }

        const token = await GameTokenService.create({
          user_id: validatedInput.user_id,
          type: validatedInput.type,
          item_id: Number(game.item.id),
          lifetime_seconds: AntiCheatService.tokenLifetimeForType(
            validatedInput.type,
          ),
        });

        return {
          type: validatedInput.type,
          item: game.item,
          empty: false,
          completed: false,
          game_token: token.token,
          token_expires_at: token.expires_at,
        };
      },
    );

    if (!result.success) {
      return jsonResponse(result, statusFromErrorCode(result.error.code));
    }

    return jsonResponse(result, 200);
  } catch (error: unknown) {
    const gameError =
      error instanceof GameEngineError
        ? error
        : new GameEngineError(
            error instanceof Error ? error.message : "Unexpected server error",
            "INTERNAL_SERVER_ERROR",
          );

    console.error("GET_NEXT_GAME_ERROR", {
      code: gameError.code,
      message: gameError.message,
      details: gameError.details,
    });

    return jsonResponse(
      {
        success: false,
        error: {
          code: gameError.code,
          message: gameError.message,
          details: gameError.details,
        },
      },
      statusFromErrorCode(gameError.code),
    );
  }
});
