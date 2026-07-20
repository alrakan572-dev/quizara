export type AppLanguage = "ar" | "en";

export interface ApiErrorPayload { code: string; message: string; details?: unknown; hint?: unknown; }
export interface ApiSuccess<T> { success: true; data: T; }
export interface ApiFailure { success: false; error: ApiErrorPayload; }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface HomeUser {
  id: number; telegram_id: number; username: string | null; first_name: string | null; photo_url: string | null;
  points: number; coins: number; hints: number; extra_spins: number; level: number;
  games_played: number; total_correct: number; total_wrong: number; lives: number; streak: number; vip: boolean;
  last_login: string | null; created_at: string | null;
}

export interface HomeChallenge {
  id: number; scope: "daily" | "weekly"; title: string | null; description: string | null;
  challenge_type: string | null; language: AppLanguage; required_count: number; reward_points: number;
  progress: number; score: number; progress_percent: number; completed: boolean; completed_at: string | null;
  reward_claimed: boolean; can_claim: boolean; user_challenge_id: number | null;
}

export interface VipSubscription { id?: number; plan_id?: number | null; source?: string | null; start_date?: string | null; expire_date?: string | null; active?: boolean; remaining_seconds?: number; remaining_days?: number; }
export interface VipPlan { id: number; name: string; duration_days: number; price: number; unlimited_games: boolean; ads_enabled: boolean; lucky_boxes_per_day: number; bonus_points_percent: number; vip_badge: boolean; description?: string | null; }
export interface VipPlansData { plans: VipPlan[]; }
export interface VipStatus { vip: boolean; subscription: VipSubscription | null; plan: VipPlan | null; benefits?: { unlimited_games: boolean; ads_enabled: boolean; lucky_boxes_per_day: number; bonus_points_percent: number; vip_badge: boolean; }; }
export interface LeaderboardEntry { rank: number; telegram_id: number; username: string | null; total_points: number; level: number; vip: boolean; photo_url: string | null; }

export interface LuckyBoxStatus {
  provider: "monetag";
  zone_id: number;
  ad_required: true;
  daily_limit: number;
  opened_today: number;
  remaining_today: number;
  cooldown_hours: number;
  cooldown_active: boolean;
  remaining_seconds: number;
  last_opened_at: string | null;
  next_open_at: string | null;
  can_watch_ad: boolean;
  can_open: boolean;
  verified_attempt_id: string | null;
  pending_attempt_id: string | null;
}

export interface HomeData {
  user: HomeUser;
  vip: VipStatus;
  challenges: { daily: HomeChallenge[]; weekly: HomeChallenge[]; };
  leaderboard: { top: LeaderboardEntry[]; current_user: LeaderboardEntry | null; };
  lucky_box: LuckyBoxStatus;
  settings: Record<string, string | null>;
  meta: { language: AppLanguage; generated_at: string; };
}
