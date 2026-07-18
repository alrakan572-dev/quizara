import { useMemo } from "react";

import { useHomeData } from "../home/HomeDataProvider";

export function useHomeDashboard() {
  const home = useHomeData();

  const dashboard = useMemo(() => {
    const data = home.data;

    if (!data) {
      return null;
    }

    const dailyCompleted =
      data.daily_challenges.filter(
        (item) => item.completed,
      ).length;

    const weeklyCompleted =
      data.weekly_challenges.filter(
        (item) => item.completed,
      ).length;

    return {
      user: data.user,
      points: data.user.points,
      level: data.user.level ?? 1,
      streak: data.user.streak ?? 0,
      lives: data.user.lives,
      vipActive: data.vip.active,
      vipExpiresAt:
        data.vip.expires_at,
      leaderboardRank:
        data.leaderboard.rank,
      totalPlayers:
        data.leaderboard.total_players,
      luckyBoxAvailable:
        data.lucky_box.available,
      luckyBoxRequiresAd:
        data.lucky_box
          .requires_rewarded_ad,
      daily: {
        items:
          data.daily_challenges,
        completed:
          dailyCompleted,
        total:
          data.daily_challenges
            .length,
      },
      weekly: {
        items:
          data.weekly_challenges,
        completed:
          weeklyCompleted,
        total:
          data.weekly_challenges
            .length,
      },
      settings: data.settings,
    };
  }, [home.data]);

  return {
    ...home,
    dashboard,
  };
}
