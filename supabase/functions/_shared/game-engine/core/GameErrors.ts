export class GameEngineError extends Error {
  code: string;
  details?: unknown;
  hint?: string;

  constructor(
    message: string,
    code = "GAME_ENGINE_ERROR",
    details?: unknown,
    hint?: string,
  ) {
    super(message);
    this.name = "GameEngineError";
    this.code = code;
    this.details = details;
    this.hint = hint;
  }
}

type ErrorLike = {
  message?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
};

function isErrorLike(value: unknown): value is ErrorLike {
  return (
    typeof value === "object" &&
    value !== null
  );
}

export function toGameEngineError(
  error: unknown,
): GameEngineError {
  if (error instanceof GameEngineError) {
    return error;
  }

  if (error instanceof Error) {
    return new GameEngineError(
      error.message || "Unexpected server error",
      "INTERNAL_SERVER_ERROR",
      {
        name: error.name,
        stack: error.stack,
      },
    );
  }

  if (isErrorLike(error)) {
    const message =
      typeof error.message === "string"
        ? error.message
        : "Database operation failed";

    const code =
      typeof error.code === "string"
        ? error.code
        : "DATABASE_ERROR";

    const hint =
      typeof error.hint === "string"
        ? error.hint
        : undefined;

    return new GameEngineError(
      message,
      code,
      error.details,
      hint,
    );
  }

  return new GameEngineError(
    typeof error === "string"
      ? error
      : "Unexpected server error",
    "INTERNAL_SERVER_ERROR",
  );
}