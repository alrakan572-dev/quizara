import type {
  GameType,
  GetNextGameInput,
  SubmitAnswerInput,
} from "../core/GameTypes.ts";

import { GameEngineError } from "../core/GameErrors.ts";
import type { GameTokenPayload } from "./GameTokenService.ts";

const GAME_TYPES: readonly GameType[] = [
  "quiz",
  "riddle",
  "fastest",
  "find_difference",
];

const DIFFICULTIES = [
  "easy",
  "medium",
  "hard",
] as const;

const LANGUAGES = [
  "ar",
  "en",
] as const;

export class AntiCheatService {
  static validateGetNextGame(input: GetNextGameInput): void {
    if (
      !Number.isSafeInteger(input.user_id) ||
      input.user_id <= 0
    ) {
      throw new GameEngineError(
        "Invalid user_id",
        "INVALID_USER_ID",
      );
    }

    if (!GAME_TYPES.includes(input.type)) {
      throw new GameEngineError(
        "Invalid game type",
        "INVALID_GAME_TYPE",
      );
    }

    if (
      input.language &&
      !LANGUAGES.includes(input.language)
    ) {
      throw new GameEngineError(
        "Invalid language",
        "INVALID_LANGUAGE",
      );
    }

    if (
      input.difficulty &&
      !DIFFICULTIES.includes(input.difficulty)
    ) {
      throw new GameEngineError(
        "Invalid difficulty",
        "INVALID_DIFFICULTY",
      );
    }

    if (
      input.category !== undefined &&
      input.category.trim().length > 100
    ) {
      throw new GameEngineError(
        "Category is too long",
        "INVALID_CATEGORY",
      );
    }
  }

  static validateSubmitAnswer(input: SubmitAnswerInput): void {
    if (
      !Number.isSafeInteger(input.user_id) ||
      input.user_id <= 0
    ) {
      throw new GameEngineError(
        "Invalid user_id",
        "INVALID_USER_ID",
      );
    }

    if (
      !Number.isSafeInteger(input.item_id) ||
      input.item_id <= 0
    ) {
      throw new GameEngineError(
        "Invalid item_id",
        "INVALID_ITEM_ID",
      );
    }

    if (!GAME_TYPES.includes(input.type)) {
      throw new GameEngineError(
        "Invalid game type",
        "INVALID_GAME_TYPE",
      );
    }

    const answerTimeMs = Number(
      input.answer_time_ms ?? 0,
    );

    if (
      !Number.isFinite(answerTimeMs) ||
      answerTimeMs < 0 ||
      answerTimeMs > 3_600_000
    ) {
      throw new GameEngineError(
        "Invalid answer_time_ms",
        "INVALID_ANSWER_TIME",
      );
    }

    if (input.type === "find_difference") {
      const foundCount = Number(input.found_count);

      if (
        !Number.isSafeInteger(foundCount) ||
        foundCount < 0 ||
        foundCount > 100
      ) {
        throw new GameEngineError(
          "Invalid found_count",
          "INVALID_FOUND_COUNT",
        );
      }

      return;
    }

    if (
      typeof input.answer !== "string" ||
      input.answer.trim().length === 0 ||
      input.answer.length > 500
    ) {
      throw new GameEngineError(
        "Answer is required",
        "INVALID_ANSWER",
      );
    }
  }

  static validateTokenBinding(params: {
    token: GameTokenPayload;
    input: SubmitAnswerInput;
  }): void {
    if (params.token.user_id !== params.input.user_id) {
      throw new GameEngineError(
        "Game token does not belong to this user",
        "GAME_TOKEN_USER_MISMATCH",
      );
    }

    if (params.token.type !== params.input.type) {
      throw new GameEngineError(
        "Game token type mismatch",
        "GAME_TOKEN_TYPE_MISMATCH",
      );
    }

    if (params.token.item_id !== params.input.item_id) {
      throw new GameEngineError(
        "Game token item mismatch",
        "GAME_TOKEN_ITEM_MISMATCH",
      );
    }
  }

  static validateAnswerTiming(params: {
    token: GameTokenPayload;
    input: SubmitAnswerInput;
    item: Record<string, unknown>;
  }): void {
    const elapsedMs = Date.now() - params.token.issued_at;

    if (
      !Number.isFinite(elapsedMs) ||
      elapsedMs < 0
    ) {
      throw new GameEngineError(
        "Invalid token timing",
        "INVALID_TOKEN_TIMING",
      );
    }

    const reportedMs = Number(
      params.input.answer_time_ms ?? elapsedMs,
    );

    if (elapsedMs < 250) {
      throw new GameEngineError(
        "Answer submitted too quickly",
        "ANSWER_TOO_FAST",
      );
    }

    if (
      !Number.isFinite(reportedMs) ||
      reportedMs < 0 ||
      reportedMs > elapsedMs + 3_000
    ) {
      throw new GameEngineError(
        "Invalid answer timing",
        "INVALID_ANSWER_TIME",
      );
    }

    if (params.input.type === "fastest") {
      const timeLimitSeconds = Number(
        params.item.time_limit ?? 10,
      );

      if (
        !Number.isFinite(timeLimitSeconds) ||
        timeLimitSeconds <= 0
      ) {
        throw new GameEngineError(
          "Invalid fastest time limit",
          "INVALID_TIME_LIMIT",
        );
      }

      const maximumMs =
        timeLimitSeconds * 1000 + 1_500;

      if (elapsedMs > maximumMs) {
        throw new GameEngineError(
          "Fastest challenge time expired",
          "GAME_TIME_EXPIRED",
        );
      }
    }
  }

  static validateFastestTime(params: {
    answerTimeMs: number;
    timeLimitSeconds: number;
  }): boolean {
    if (
      !Number.isFinite(params.answerTimeMs) ||
      params.answerTimeMs < 0
    ) {
      return false;
    }

    if (
      !Number.isFinite(params.timeLimitSeconds) ||
      params.timeLimitSeconds <= 0
    ) {
      return false;
    }

    return (
      params.answerTimeMs <=
      params.timeLimitSeconds * 1000
    );
  }

  static tokenLifetimeForType(type: GameType): number {
    if (type === "fastest") {
      return 30;
    }

    if (type === "find_difference") {
      return 600;
    }

    return 300;
  }
}