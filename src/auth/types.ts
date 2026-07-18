export interface AuthUser {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language_code: string | null;
  photo_url: string | null;
  telegram_is_premium: boolean;
  vip: boolean;
  points: number;
  coins: number;
  hints: number;
  extra_spins: number;
  level: number;
}

export interface AuthSession {
  session_token: string;
  expires_at: string;
  user: AuthUser;
}

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "telegram_required"
  | "error";

export interface AuthContextValue {
  status: AuthStatus;
  session: AuthSession | null;
  user: AuthUser | null;
  error: string | null;
  refreshAuthentication: () => Promise<void>;
  clearSession: () => void;
}

export interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
}

export interface TelegramWindow {
  Telegram?: { WebApp?: TelegramWebApp };
}

export type TelegramAuthApiResult =
  | { success: true; data: AuthSession }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };
