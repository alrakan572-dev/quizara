import { SessionStorage } from "../auth";

export interface HomeUser {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  photo_url: string | null;
  language: string;
  points: number;
  level: number | null;
  streak: number | null;
  lives: number | null;
}

export interface HomeVip {
  active: boolean;
  plan: string | null;
  expires_at: string | null;
}

export interface HomeLeaderboard {
  rank: number | null;
  total_players: number;
  total_points: number;
}

export interface HomeChallenge {
  id: number;
  title: string;
  description: string | null;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  reward_points: number;
  expires_at: string | null;
}

export interface HomeLuckyBox {
  available: boolean;
  requires_rewarded_ad: boolean;
  next_available_at: string | null;
}

export interface HomeSettings {
  app_version: string | null;
  maintenance_mode: boolean;
  telegram_bot_username: string | null;
  support_username: string | null;
  ads_every_questions: number | null;
}

export interface HomeData {
  user: HomeUser;
  vip: HomeVip;
  leaderboard: HomeLeaderboard;
  daily_challenges: HomeChallenge[];
  weekly_challenges: HomeChallenge[];
  lucky_box: HomeLuckyBox;
  settings: HomeSettings;
  meta: {
    generated_at: string;
  };
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class HomeAPIError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(params: {
    message: string;
    code?: string;
    status?: number;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "HomeAPIError";
    this.code = params.code ?? "HOME_API_ERROR";
    this.status = params.status ?? 500;
    this.details = params.details;
  }
}

const SUPABASE_URL = String(
  import.meta.env.VITE_SUPABASE_URL ?? "",
).replace(/\/+$/, "");

const SUPABASE_ANON_KEY = String(
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
).trim();

async function invoke<T>(
  functionName: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const token = SessionStorage.getToken();

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new HomeAPIError({
      code: "MISSING_CONFIGURATION",
      message: "Supabase frontend configuration is missing",
    });
  }

  if (!token) {
    throw new HomeAPIError({
      code: "SESSION_REQUIRED",
      status: 401,
      message: "A valid Quizara Telegram session is required",
    });
  }

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal,
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | null;

  if (!payload) {
    throw new HomeAPIError({
      code: "INVALID_API_RESPONSE",
      status: response.status,
      message: "The server returned an invalid response",
    });
  }

  if (!response.ok || !payload.success) {
    const error = !payload.success
      ? payload.error
      : {
          code: "HTTP_ERROR",
          message: `Request failed with status ${response.status}`,
        };

    throw new HomeAPIError({
      code: error.code,
      status: response.status,
      message: error.message,
      details: error.details,
    });
  }

  return payload.data;
}

export const HomeAPI = {
  getHomeData(signal?: AbortSignal): Promise<HomeData> {
    return invoke<HomeData>("get-home-data", {}, signal);
  },
};
