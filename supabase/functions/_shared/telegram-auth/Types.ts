export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface ValidatedTelegramInitData {
  authDate: Date;
  queryId: string | null;
  user: TelegramUser;
}

export interface TelegramAuthResponse {
  session_token: string;
  expires_at: string;
  user: {
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
  };
}

export interface AuthenticatedSession {
  sessionId: string;
  userId: number;
  telegramId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  languageCode: string | null;
  photoUrl: string | null;
  vip: boolean;
  expiresAt: string;
}
