import type {
  AuthSession,
  TelegramAuthApiResult,
  TelegramWebApp,
  TelegramWindow,
} from "./types";

const SUPABASE_URL = String(
  import.meta.env.VITE_SUPABASE_URL ?? "",
).replace(/\/+$/, "");

const SUPABASE_ANON_KEY = String(
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
).trim();

function configuration(): void {
  if (!SUPABASE_URL) throw new Error("VITE_SUPABASE_URL is not configured");
  if (!SUPABASE_ANON_KEY) throw new Error("VITE_SUPABASE_ANON_KEY is not configured");
}

function webApp(): TelegramWebApp | null {
  return (window as unknown as Window & TelegramWindow).Telegram?.WebApp ?? null;
}

export const TelegramClient = {
  initialize(): void {
    const app = webApp();
    if (!app) return;

    app.ready();
    app.expand();
    app.disableVerticalSwipes?.();
    app.setHeaderColor?.("#111827");
    app.setBackgroundColor?.("#111827");
  },

  isInsideTelegram(): boolean {
    return Boolean(webApp()?.initData?.trim());
  },

  getInitData(): string {
    const value = webApp()?.initData?.trim() ?? "";

    if (!value) {
      throw new Error(
        "Quizara must be opened from the official Telegram Mini App",
      );
    }

    return value;
  },

  async authenticate(signal?: AbortSignal): Promise<AuthSession> {
    configuration();

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/telegram-auth`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ init_data: this.getInitData() }),
        signal,
      },
    );

    const payload = (await response.json().catch(() => null)) as
      | TelegramAuthApiResult
      | null;

    if (!payload) {
      throw new Error("The authentication server returned an invalid response");
    }

    if (!response.ok || payload.success === false) {
      throw new Error(
        payload.success === false
          ? payload.error.message
          : `Authentication failed with status ${response.status}`,
      );
    }

    return payload.data;
  },
};
