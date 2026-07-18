import type { GameEngineResult } from "./GameTypes.ts";
import { toGameEngineError } from "./GameErrors.ts";

export function success<T>(
  data: T,
): GameEngineResult<T> {
  return {
    success: true,
    data,
  };
}

export function failure(
  error: unknown,
): GameEngineResult<never> {
  const gameError = toGameEngineError(error);

  return {
    success: false,
    error: {
      message: gameError.message,
      code: gameError.code,
      details: gameError.details,
      hint: gameError.hint,
    },
  };
}