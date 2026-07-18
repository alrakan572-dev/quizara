import { requireTelegramSession } from "../_shared/telegram-auth/index.ts";
import {
  AntiCheatService,
  ContentRepo,
  GameEngine,
  GameEngineError,
  GameTokenService,
  SubmitAnswerService,
  ValidationService,
  toGameEngineError,
  type SubmitAnswerInput,
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
  const badRequestCodes = new Set([
    "INVALID_JSON_BODY",
    "VALIDATION_ERROR",
    "INVALID_USER_ID",
    "INVALID_ITEM_ID",
    "INVALID_GAME_TYPE",
    "INVALID_ANSWER",
    "MISSING_ANSWER",
    "INVALID_FOUND_COUNT",
    "INVALID_ANSWER_TIME",
    "INVALID_TOKEN_TIMING",
    "INVALID_TIME_LIMIT",
    "INVALID_CONTENT_DIFFICULTY",
    "22P02",
    "23502",
    "23514",
  ]);

  const unauthorizedCodes = new Set([
    "MISSING_GAME_TOKEN",
    "INVALID_GAME_TOKEN",
    "GAME_TOKEN_EXPIRED",
    "GAME_TOKEN_USER_MISMATCH",
    "GAME_TOKEN_TYPE_MISMATCH",
    "GAME_TOKEN_ITEM_MISMATCH",
  ]);

  const forbiddenCodes = new Set([
    "ANSWER_TOO_FAST",
    "GAME_TIME_EXPIRED",
    "CONTENT_NOT_ACTIVE",
  ]);

  const conflictCodes = new Set(["ANSWER_ALREADY_SUBMITTED", "23505"]);

  const notFoundCodes = new Set([
    "USER_NOT_FOUND",
    "CONTENT_NOT_FOUND",
    "PGRST116",
  ]);

  if (badRequestCodes.has(code)) return 400;
  if (unauthorizedCodes.has(code)) return 401;
  if (forbiddenCodes.has(code)) return 403;
  if (notFoundCodes.has(code)) return 404;
  if (conflictCodes.has(code)) return 409;

  return 500;
}

function logError(
  label: string,
  error: {
    code?: string;
    message?: string;
    details?: unknown;
    hint?: string;
    stack?: string;
  },
): void {
  console.error(
    label,
    JSON.stringify({
      code: error.code ?? "UNKNOWN_ERROR",
      message: error.message ?? "Unknown error",
      details: error.details ?? null,
      hint: error.hint ?? null,
      stack: error.stack ?? null,
      timestamp: new Date().toISOString(),
    }),
  );
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

    const gameToken = String(rawBody?.game_token ?? "").trim();

    if (!gameToken) {
      throw new GameEngineError("game_token is required", "MISSING_GAME_TOKEN");
    }

    const input = ValidationService.submitAnswer({
      user_id: userId,
      type: rawBody?.type,
      item_id: Number(rawBody?.item_id),
      answer: rawBody?.answer,
      found_count: rawBody?.found_count,
      answer_time_ms: rawBody?.answer_time_ms,
    } as SubmitAnswerInput);

    const tokenPayload = await GameTokenService.verify(gameToken);

    AntiCheatService.validateTokenBinding({
      token: tokenPayload,
      input,
    });

    const item = await ContentRepo.getById(input.type, input.item_id);

    if (!item) {
      throw new GameEngineError("Content was not found", "CONTENT_NOT_FOUND");
    }

    if (item.active !== true) {
      throw new GameEngineError("Content is not active", "CONTENT_NOT_ACTIVE");
    }

    AntiCheatService.validateAnswerTiming({
      token: tokenPayload,
      input,
      item,
    });

    const result = await GameEngine.submitAnswer(
      input,
      async (validatedInput) => {
        return await SubmitAnswerService.execute(validatedInput);
      },
    );

    if (!result.success) {
      logError("SUBMIT_ANSWER_ENGINE_FAILURE", {
        code: result.error.code,
        message: result.error.message,
        details: result.error.details,
        hint: result.error.hint,
      });

      return jsonResponse(result, statusFromErrorCode(result.error.code));
    }

    console.log(
      "SUBMIT_ANSWER_SUCCESS",
      JSON.stringify({
        user_id: input.user_id,
        type: input.type,
        item_id: input.item_id,
        timestamp: new Date().toISOString(),
      }),
    );

    return jsonResponse(result, 200);
  } catch (error: unknown) {
    const gameError = toGameEngineError(error);

    logError("SUBMIT_ANSWER_EXCEPTION", {
      code: gameError.code,
      message: gameError.message,
      details: gameError.details,
      hint: gameError.hint,
      stack: error instanceof Error ? error.stack : undefined,
    });

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
      statusFromErrorCode(gameError.code),
    );
  }
});
