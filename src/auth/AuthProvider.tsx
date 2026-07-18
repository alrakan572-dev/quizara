import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { AuthContext } from "./AuthContext";
import { SessionStorage } from "./SessionStorage";
import { TelegramClient } from "./TelegramClient";
import type { AuthSession, AuthStatus } from "./types";

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async (signal?: AbortSignal) => {
    setStatus("loading");
    setError(null);
    TelegramClient.initialize();

    const stored = SessionStorage.read();

    if (stored) {
      setSession(stored);
      setStatus("authenticated");
      return;
    }

    if (!TelegramClient.isInsideTelegram()) {
      setSession(null);
      setStatus("telegram_required");
      return;
    }

    try {
      const next = await TelegramClient.authenticate(signal);
      SessionStorage.write(next);
      setSession(next);
      setStatus("authenticated");
    } catch (unknownError) {
      if (
        unknownError instanceof DOMException &&
        unknownError.name === "AbortError"
      ) {
        return;
      }

      SessionStorage.clear();
      setSession(null);
      setError(
        unknownError instanceof Error
          ? unknownError.message
          : "Telegram authentication failed",
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void authenticate(controller.signal);
    return () => controller.abort();
  }, [authenticate]);

  useEffect(() => {
    const handleExpiredSession = () => {
      SessionStorage.clear();
      setSession(null);
      void authenticate();
    };

    window.addEventListener(
      "quizara:session-expired",
      handleExpiredSession,
    );

    return () => {
      window.removeEventListener(
        "quizara:session-expired",
        handleExpiredSession,
      );
    };
  }, [authenticate]);

  const refreshAuthentication = useCallback(async () => {
    SessionStorage.clear();
    setSession(null);
    await authenticate();
  }, [authenticate]);

  const clearSession = useCallback(() => {
    SessionStorage.clear();
    setSession(null);
    setStatus(
      TelegramClient.isInsideTelegram()
        ? "loading"
        : "telegram_required",
    );
  }, []);

  const value = useMemo(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      error,
      refreshAuthentication,
      clearSession,
    }),
    [status, session, error, refreshAuthentication, clearSession],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
