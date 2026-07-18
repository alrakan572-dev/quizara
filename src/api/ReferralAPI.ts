import { SessionStorage } from "../auth";

export interface ReferralFriend {
  claim_id: number;
  user_id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  photo_url: string | null;
  joined_at: string;
  inviter_reward_points: number;
}

export interface ReferralData {
  referral: {
    id: number;
    referral_code: string;
    referral_url: string;
    active: boolean;
    created_at: string;
  };
  stats: {
    invited_count: number;
    registered_count: number;
    total_points_earned: number;
  };
  friends: ReferralFriend[];
}

export interface ClaimReferralResult {
  idempotent: boolean;
  claim_id: number;
  referral_code?: string;
  inviter_reward_points: number;
  invited_reward_points: number;
  inviter_points_after?: number;
  invited_points_after?: number;
  claimed_at: string;
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

export class ReferralAPIError extends Error {
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
    this.name = "ReferralAPIError";
    this.code = params.code ?? "REFERRAL_API_ERROR";
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
    throw new ReferralAPIError({
      code: "MISSING_CONFIGURATION",
      message: "Supabase frontend configuration is missing",
    });
  }

  if (!token) {
    throw new ReferralAPIError({
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
    throw new ReferralAPIError({
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

    throw new ReferralAPIError({
      code: error.code,
      status: response.status,
      message: error.message,
      details: error.details,
    });
  }

  return payload.data;
}

export const ReferralAPI = {
  getReferral(signal?: AbortSignal): Promise<ReferralData> {
    return invoke<ReferralData>("get-referral", {}, signal);
  },

  createReferralLink(): Promise<ReferralData["referral"]> {
    return invoke("create-referral-link", {});
  },

  claimReferral(
    referralCode: string,
  ): Promise<ClaimReferralResult> {
    return invoke("claim-referral", {
      referral_code: referralCode,
    });
  },
};
