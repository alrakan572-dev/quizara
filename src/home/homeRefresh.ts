export type HomeRefreshReason =
  | "answer-submitted"
  | "challenge-updated"
  | "challenge-reward-claimed"
  | "lucky-box-opened"
  | "ad-reward-claimed"
  | "profile-updated"
  | "settings-updated"
  | "referral-claimed"
  | "vip-updated"
  | "leaderboard-updated"
  | "manual";

export interface HomeRefreshDetail {
  reason: HomeRefreshReason;
  source?: string;
  at: number;
}

export const HOME_REFRESH_EVENT =
  "quizara:home-refresh";

export function requestHomeRefresh(
  reason: HomeRefreshReason,
  source?: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<HomeRefreshDetail>(
      HOME_REFRESH_EVENT,
      {
        detail: {
          reason,
          source,
          at: Date.now(),
        },
      },
    ),
  );
}
