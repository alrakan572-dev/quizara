export class TelegramAuthError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(
    message: string,
    code: string,
    status = 401,
    details: unknown = null,
  ) {
    super(message);
    this.name = "TelegramAuthError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function toTelegramAuthError(error: unknown): TelegramAuthError {
  if (error instanceof TelegramAuthError) return error;
  return new TelegramAuthError(
    error instanceof Error ? error.message : "Telegram authentication failed",
    "TELEGRAM_AUTH_INTERNAL_ERROR",
    500,
  );
}
