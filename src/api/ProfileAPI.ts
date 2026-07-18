import { SessionStorage } from "../auth";

export type ProfileLanguage = "ar" | "en";

export interface ProfileData {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  photo_url: string | null;
  country: string | null;
  language: ProfileLanguage;
  bio: string | null;
  points: number;
  coins: number;
  hints: number;
  extra_spins: number;
  level: number;
  games_played: number;
  total_correct: number;
  total_wrong: number;
  vip: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface UpdateProfileInput {
  username: string | null;
  first_name: string | null;
  photo_url: string | null;
  country: string | null;
  language: ProfileLanguage;
  bio: string | null;
}

interface ApiSuccess<T> { success: true; data: T; }
interface ApiFailure { success: false; error: { code: string; message: string; details?: unknown; hint?: unknown; }; }
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ProfileAPIError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(params: { message: string; code?: string; status?: number; details?: unknown }) {
    super(params.message);
    this.name = "ProfileAPIError";
    this.code = params.code ?? "PROFILE_API_ERROR";
    this.status = params.status ?? 500;
    this.details = params.details;
  }
}

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

async function invoke<T>(name: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new ProfileAPIError({ code: "MISSING_CONFIGURATION", message: "Supabase frontend configuration is missing" });
  }

  const token = SessionStorage.getToken();
  if (!token) {
    throw new ProfileAPIError({ code: "SESSION_REQUIRED", status: 401, message: "A valid Quizara Telegram session is required" });
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  const payload = await response.json().catch(() => null) as ApiResponse<T> | null;
  if (!payload) throw new ProfileAPIError({ code: "INVALID_API_RESPONSE", status: response.status, message: "Invalid profile API response" });
  if (!response.ok || payload.success === false) {
    const error = payload.success === false ? payload.error : { code: "HTTP_ERROR", message: `Request failed with status ${response.status}` };
    throw new ProfileAPIError({ code: error.code, status: response.status, message: error.message, details: error.details });
  }
  return payload.data;
}

export const ProfileAPI = {
  getProfile: (signal?: AbortSignal) => invoke<ProfileData>("get-profile", {}, signal),
  updateProfile: (input: UpdateProfileInput, signal?: AbortSignal) =>
    invoke<ProfileData>("update-profile", input as unknown as Record<string, unknown>, signal),
};
