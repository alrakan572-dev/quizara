import { LeaderboardRepository } from "../repositories/LeaderboardRepository";
import { getUserByTelegramId } from "./userService";

export async function syncUserToLeaderboard(telegramId: number) {
  const { data: user, error } = await getUserByTelegramId(telegramId);

  if (error || !user) {
    console.error("Leaderboard User Error:", error);
    return { data: null, error };
  }

  return await LeaderboardRepository.upsertUser({
    telegram_id: user.telegram_id,
    username: user.username,
    points: user.points ?? 0,
    level: user.level ?? 1,
  });
}

export async function getLeaderboard(limit = 100) {
  return await LeaderboardRepository.getTop(limit);
}