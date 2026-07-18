import type {
  Difficulty,
  GameType,
  GetNextGameInput,
  Language,
  SubmitAnswerInput,
} from "../core/GameTypes.ts";

import { GameEngineError } from "../core/GameErrors.ts";

const gameTypes = new Set<GameType>([
  "quiz",
  "riddle",
  "fastest",
  "find_difference",
]);

const difficulties = new Set<Difficulty>([
  "easy",
  "medium",
  "hard",
]);

const languages = new Set<Language>([
  "ar",
  "en",
]);

function requirePositiveInteger(
  value: unknown,
  field: string,
): number {
  const numberValue = Number(value);

  if (
    !Number.isSafeInteger(numberValue) ||
    numberValue <= 0
  ) {
    throw new GameEngineError(
      `${field} must be a positive integer`,
      "VALIDATION_ERROR",
      { field },
    );
  }

  return numberValue;
}

function validateGameType(value: unknown): GameType {
  const type = String(value ?? "") as GameType;

  if (!gameTypes.has(type)) {
    throw new GameEngineError(
      "Invalid game type",
      "INVALID_GAME_TYPE",
      { type },
    );
  }

  return type;
}

function validateLanguage(value: unknown): Language {
  const language = String(value ?? "en") as Language;

  if (!languages.has(language)) {
    throw new GameEngineError(
      "Invalid language",
      "INVALID_LANGUAGE",
      { language },
    );
  }

  return language;
}

function validateDifficulty(
  value: unknown,
): Difficulty | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const difficulty = String(value) as Difficulty;

  if (!difficulties.has(difficulty)) {
    throw new GameEngineError(
      "Invalid difficulty",
      "INVALID_DIFFICULTY",
      { difficulty },
    );
  }

  return difficulty;
}

function sanitizeCategory(
  value: unknown,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const category = String(value).trim();

  if (!category) {
    return undefined;
  }

  if (category.length > 100) {
    throw new GameEngineError(
      "Category is too long",
      "VALIDATION_ERROR",
      { field: "category" },
    );
  }

  return category;
}

export class ValidationService {
  static getNextGame(
    input: GetNextGameInput,
  ): GetNextGameInput {
    return {
      user_id: requirePositiveInteger(
        input.user_id,
        "user_id",
      ),
      type: validateGameType(input.type),
      language: validateLanguage(input.language),
      category: sanitizeCategory(input.category),
      difficulty: validateDifficulty(input.difficulty),
    };
  }

  static submitAnswer(
    input: SubmitAnswerInput,
  ): SubmitAnswerInput {
    const type = validateGameType(input.type);

    const answerTimeMs = Number(
      input.answer_time_ms ?? 0,
    );

    if (
      !Number.isFinite(answerTimeMs) ||
      answerTimeMs < 0 ||
      answerTimeMs > 900_000
    ) {
      throw new GameEngineError(
        "Invalid answer_time_ms",
        "INVALID_ANSWER_TIME",
      );
    }

    if (
      type !== "find_difference" &&
      typeof input.answer !== "string"
    ) {
      throw new GameEngineError(
        "Missing answer",
        "MISSING_ANSWER",
      );
    }

    if (type === "find_difference") {
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
    }

    return {
      user_id: requirePositiveInteger(
        input.user_id,
        "user_id",
      ),
      type,
      item_id: requirePositiveInteger(
        input.item_id,
        "item_id",
      ),
      answer:
        typeof input.answer === "string"
          ? input.answer.trim()
          : undefined,
      found_count:
        type === "find_difference"
          ? Number(input.found_count)
          : undefined,
      answer_time_ms: Math.trunc(answerTimeMs),
    };
  }
}