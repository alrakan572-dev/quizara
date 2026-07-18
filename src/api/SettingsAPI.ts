import { SessionStorage } from "../auth";

export type AppPreferenceLanguage = "ar" | "en";
export type AppTheme = "dark" | "light";

export interface UserPreferences {
  language: AppPreferenceLanguage;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  music_enabled: boolean;
  theme: AppTheme;
}

export interface AccountDeletionStatus {
  deletion_pending: boolean;
  delete_requested_at: string | null;
  delete_scheduled_for: string | null;
  grace_period_days?: number;
}

export interface SettingsData {
  preferences: UserPreferences;
  account: AccountDeletionStatus;
  public_settings: Record<string, string | null>;
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

export class SettingsAPIError extends Error {
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
    this.name = "SettingsAPIError";
    this.code = params.code ?? "SETTINGS_API_ERROR";
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
    throw new SettingsAPIError({
      code: "MISSING_CONFIGURATION",
      message: "Supabase frontend configuration is missing",
    });
  }

  if (!token) {
    throw new SettingsAPIError({
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
    throw new SettingsAPIError({
      code: "INVALID_API_RESPONSE",
      status: response.status,
      message: "The server returned an invalid response",
    });
  }

  if (!response.ok || payload.success === false) {
    const error = payload.success === false
      ? payload.error
      : {
          code: "HTTP_ERROR",
          message: `Request failed with status ${response.status}`,
        };

    throw new SettingsAPIError({
      code: error.code,
      status: response.status,
      message: error.message,
      details: error.details,
    });
  }

  return payload.data;
}

export const SettingsAPI = {
  getSettings(signal?: AbortSignal): Promise<SettingsData> {
    return invoke<SettingsData>("get-settings", {}, signal);
  },

  updateSettings(
    preferences: UserPreferences,
  ): Promise<Pick<SettingsData, "preferences" | "account">> {
    return invoke("update-settings", preferences as unknown as Record<string, unknown>);
  },

  requestAccountDeletion(): Promise<AccountDeletionStatus> {
    return invoke("delete-account", {});
  },

  cancelAccountDeletion(): Promise<AccountDeletionStatus> {
    return invoke("cancel-delete-account", {});
  },
};
