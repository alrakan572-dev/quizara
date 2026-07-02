import { updateUserStatsAfterAnswer } from "../services/userService";
import { syncUserToLeaderboard } from "../services/LeaderboardService";

export type GameEventType =
  | "answer_correct"
  | "answer_wrong"
  | "play_game"
  | "solve_riddles"
  | "finish_fastest"
  | "complete_find_difference"
  | "earn_points"
  | "lucky_box_spin";

export async function emitGameEvent(event: {
  type: GameEventType;
  telegramId: number;
  points?: number;
}) {
  if (event.type === "answer_correct") {
    await updateUserStatsAfterAnswer(event.telegramId, true);
    await syncUserToLeaderboard(event.telegramId);
    return true;
  }

  if (event.type === "answer_wrong") {
    await updateUserStatsAfterAnswer(event.telegramId, false);
    await syncUserToLeaderboard(event.telegramId);
    return true;
  }

  if (event.type === "lucky_box_spin") {
    await syncUserToLeaderboard(event.telegramId);
    return true;
  }

  return true;
}