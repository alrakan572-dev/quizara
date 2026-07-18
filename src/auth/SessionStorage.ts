import type { AuthSession } from "./types";

const STORAGE_KEY = "quizara.auth.session.v1";

function valid(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<AuthSession>;
  const user = session.user as Partial<AuthSession["user"]> | undefined;

  return Boolean(
    typeof session.session_token === "string" &&
    session.session_token.length >= 40 &&
    typeof session.expires_at === "string" &&
    user &&
    Number.isSafeInteger(Number(user.id)) &&
    Number(user.id) > 0 &&
    Number.isSafeInteger(Number(user.telegram_id)) &&
    Number(user.telegram_id) > 0,
  );
}

function expired(expiresAt: string): boolean {
  const value = Date.parse(expiresAt);
  return !Number.isFinite(value) || value <= Date.now() + 60_000;
}

export const SessionStorage = {
  read(): AuthSession | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed: unknown = JSON.parse(raw);
      if (!valid(parsed) || expired(parsed.expires_at)) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return parsed;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  },

  write(session: AuthSession): void {
    if (!valid(session) || expired(session.expires_at)) {
      throw new Error("Cannot store an invalid or expired Quizara session");
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  },

  clear(): void {
    window.localStorage.removeItem(STORAGE_KEY);
  },

  getToken(): string | null {
    return this.read()?.session_token ?? null;
  },
};
