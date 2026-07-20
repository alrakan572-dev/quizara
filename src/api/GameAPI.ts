import { SessionStorage } from "../auth";
import type { ApiResponse, AppLanguage, HomeData, HomeChallenge, LeaderboardEntry, VipStatus, VipPlansData } from "./types";

export type GameType = "quiz" | "riddle" | "fastest" | "find_difference";
export interface GameItem { id: number; question?: string | null; option_a?: string | null; option_b?: string | null; option_c?: string | null; option_d?: string | null; difficulty?: string | null; points?: number | null; category?: string | null; language?: string | null; time_limit?: number | null; image_1_url?: string | null; image_2_url?: string | null; differences_count?: number | null; differences_data?: unknown; [key: string]: unknown; }
export interface GetNextGameData { type: GameType; item: GameItem | null; empty: boolean; completed: boolean; game_token: string | null; token_expires_at: number | null; }
export interface SubmitAnswerData { type: GameType; item_id: number; is_correct: boolean; points_earned: number; correct_answer: string | null; user: { id: number; points: number; games_played: number; total_correct: number; total_wrong: number; level: number; }; }
export interface LeaderboardData { scope: string; leaders: LeaderboardEntry[]; current_user: LeaderboardEntry | null; pagination: { limit: number; offset: number; total: number; has_more: boolean; }; }
export interface ActiveChallengesData { user_id: number; language: AppLanguage; daily: HomeChallenge[]; weekly: HomeChallenge[]; }
export interface AdAttemptData { attempt_id: string; ymid: string; provider: "monetag"; zone_id: number; request_var: "lucky_box"; status: "pending" | "valued" | "non_valued" | "consumed" | "expired"; expires_at: string; }
export interface AdAttemptStatusData { attempt_id: string; status: "pending" | "valued" | "non_valued" | "consumed" | "expired"; verified: boolean; consumed: boolean; expires_at: string; }

export interface AchievementItem { id: number; code: string; category: string; name: string; description: string; emoji: string; rarity: "Common" | "Rare" | "Epic" | "Legendary"; reward_points: number; metric: string; target: number; sort_order: number; progress: number; unlocked: boolean; claimed: boolean; unlocked_at: string | null; claimed_at: string | null; }
export interface RewardLedgerItem { id: number; source_type: string; source_id: string; points: number; metadata: Record<string, unknown>; created_at: string; }
export interface RewardsData { user: { points: number }; summary: { total_claimed_points: number; available_points: number; unlocked_count: number; total_count: number }; achievements: AchievementItem[]; recent_rewards: RewardLedgerItem[]; }
export interface ClaimAchievementData { already_claimed: boolean; points_awarded: number; points_after: number; }
export interface LuckyBoxOpenData { ad_attempt_id: string; reward: { id: number; type: string; value: number; probability?: number; }; points_after: number; hints_after: number; extra_spins_after: number; vip: boolean; vip_expire_date?: string | null; daily_limit: number; opened_today: number; opened_at: string; }

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

export class GameAPIError extends Error {
  readonly code: string; readonly status: number; readonly details: unknown; readonly hint: unknown;
  constructor(params: { message: string; code?: string; status?: number; details?: unknown; hint?: unknown; }) {
    super(params.message); this.name = "GameAPIError"; this.code = params.code ?? "GAME_API_ERROR"; this.status = params.status ?? 500; this.details = params.details; this.hint = params.hint;
  }
}

function ensureConfiguration(): void {
  if (!SUPABASE_URL) throw new GameAPIError({ code: "MISSING_SUPABASE_URL", message: "VITE_SUPABASE_URL is not configured" });
  if (!SUPABASE_ANON_KEY) throw new GameAPIError({ code: "MISSING_SUPABASE_ANON_KEY", message: "VITE_SUPABASE_ANON_KEY is not configured" });
}
function requireSessionToken(): string {
  const token = SessionStorage.getToken();
  if (!token) throw new GameAPIError({ code: "SESSION_REQUIRED", message: "A valid Quizara Telegram session is required", status: 401 });
  return token;
}
function expireSession(): void { SessionStorage.clear(); window.dispatchEvent(new CustomEvent("quizara:session-expired")); }

async function invokeFunction<T>(functionName: string, body: Record<string, unknown>, options?: { signal?: AbortSignal }): Promise<T> {
  ensureConfiguration();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${requireSessionToken()}` },
    body: JSON.stringify(body),
    signal: options?.signal,
  });
  const raw = await response.json().catch(() => null) as ApiResponse<T> | null;
  if (!raw) throw new GameAPIError({ status: response.status, code: "INVALID_API_RESPONSE", message: "The server returned an invalid response" });
  if (response.status === 401) expireSession();
  if (response.ok && raw.success && !("data" in raw)) return raw as unknown as T;
  if (!response.ok || !raw.success) {
    const legacy = raw as unknown as { message?: string; code?: string; details?: unknown; hint?: unknown; };
    const apiError = !raw.success && "error" in raw ? raw.error : { code: legacy.code ?? "HTTP_ERROR", message: legacy.message ?? `Request failed with status ${response.status}`, details: legacy.details, hint: legacy.hint };
    throw new GameAPIError({ status: response.status, code: apiError.code, message: apiError.message, details: apiError.details, hint: apiError.hint });
  }
  return raw.data;
}

export const GameAPI = {
  getHomeData: (params: { language?: AppLanguage }, options?: { signal?: AbortSignal }) => invokeFunction<HomeData>("get-home-data", { language: params.language ?? "en" }, options),
  getNextGame: (params: { type: GameType; language?: AppLanguage; difficulty?: "easy" | "medium" | "hard"; category?: string }, options?: { signal?: AbortSignal }) => invokeFunction<GetNextGameData>("get-next-game", { type: params.type, language: params.language ?? "en", ...(params.difficulty ? { difficulty: params.difficulty } : {}), ...(params.category ? { category: params.category } : {}) }, options),
  submitAnswer: (params: { type: GameType; itemId: number; gameToken: string; answer?: string; foundCount?: number; answerTimeMs: number }, options?: { signal?: AbortSignal }) => invokeFunction<SubmitAnswerData>("submit-answer", { type: params.type, item_id: params.itemId, game_token: params.gameToken, answer: params.answer, found_count: params.foundCount, answer_time_ms: Math.max(0, Math.trunc(params.answerTimeMs)) }, options),
  getLeaderboard: (params?: { limit?: number; offset?: number }) => invokeFunction<LeaderboardData>("get-leaderboard", { limit: params?.limit ?? 20, offset: params?.offset ?? 0 }),
  getActiveChallenges: (params: { language?: AppLanguage }) => invokeFunction<ActiveChallengesData>("get-active-challenges", { language: params.language ?? "en" }),
  claimChallengeReward: (params: { challengeId: number; scope: "daily" | "weekly" }) => invokeFunction<Record<string, unknown>>("claim-challenge-reward", { challenge_id: params.challengeId, challenge_scope: params.scope }),
  createLuckyBoxAdAttempt: () => invokeFunction<AdAttemptData>("claim-ad-reward", {}),
  getAdAttemptStatus: (attemptId: string) => invokeFunction<AdAttemptStatusData>("get-ad-reward-status", { attempt_id: attemptId }),
  openLuckyBox: (adAttemptId: string) => invokeFunction<LuckyBoxOpenData>("open-lucky-box", { ad_attempt_id: adAttemptId }),
  getVipStatus: () => invokeFunction<VipStatus>("get-vip-status", {}),
  getVipPlans: (options?: { signal?: AbortSignal }) => invokeFunction<VipPlansData>("get-vip-plans", {}, options),
  getRewardsData: (options?: { signal?: AbortSignal }) => invokeFunction<RewardsData>("get-rewards-data", {}, options),
  claimAchievementReward: (achievementCode: string) => invokeFunction<ClaimAchievementData>("claim-achievement-reward", { achievement_code: achievementCode }),
};
