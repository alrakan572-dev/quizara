export type StatisticType =
  | "answer_correct"
  | "answer_wrong"
  | "play_game"
  | "solve_riddles"
  | "finish_fastest"
  | "complete_find_difference"
  | "earn_points";

export function mapChallengeTypeToStatistic(
  challengeType: string
): StatisticType | null {
  const map: Record<string, StatisticType> = {
    answer_correct: "answer_correct",
    solve_riddles: "solve_riddles",
    finish_fastest: "finish_fastest",
    complete_find_difference: "complete_find_difference",
    earn_points: "earn_points",
    play_games: "play_game",
  };

  return map[challengeType] ?? null;
}