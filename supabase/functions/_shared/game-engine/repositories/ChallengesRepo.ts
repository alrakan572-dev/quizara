import { gameClient } from "./GameClient.ts";
import type { GameType } from "../core/GameTypes.ts";

function dailyType(type: GameType) {
  if (type === "quiz") return "quiz";
  if (type === "riddle") return "riddles";
  if (type === "fastest") return "fastest";
  return "find_difference";
}

function weeklyType(type: GameType) {
  if (type === "quiz") return "answer_correct";
  if (type === "riddle") return "solve_riddles";
  if (type === "fastest") return "finish_fastest";
  return "complete_find_difference";
}

async function updateChallenge(params: {
  userId: number;
  challengeType: string;
  userTable: "users_daily_challenges" | "users_weekly_challenges";
  challengeTable: "daily_challenges" | "weekly_challenge";
  score: number;
}) {
  const { data: challenges, error } = await gameClient()
    .from(params.challengeTable)
    .select("id,required_count")
    .eq("challenge_type", params.challengeType)
    .eq("active", true);

  if (error) throw error;

  for (const challenge of challenges ?? []) {
    const { data: existing, error: findError } = await gameClient()
      .from(params.userTable)
      .select("*")
      .eq("user_id", params.userId)
      .eq("challenge_id", challenge.id)
      .maybeSingle();

    if (findError) throw findError;

    const progress = Math.min(
      Number(existing?.progress ?? 0) + 1,
      Number(challenge.required_count)
    );

    const completed = progress >= Number(challenge.required_count);

    if (existing?.id) {
      const { error: updateError } = await gameClient()
        .from(params.userTable)
        .update({
          progress,
          score: Number(existing.score ?? 0) + params.score,
          completed,
          completed_at:
            completed && !existing.completed
              ? new Date().toISOString()
              : existing.completed_at,
        })
        .eq("id", existing.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await gameClient()
        .from(params.userTable)
        .insert({
          user_id: params.userId,
          challenge_id: challenge.id,
          progress,
          score: params.score,
          completed,
          reward_claimed: false,
          completed_at: completed ? new Date().toISOString() : null,
        });

      if (insertError) throw insertError;
    }
  }
}

export class ChallengesRepo {
  static async updateProgress(params: {
    userId: number;
    type: GameType;
    isCorrect: boolean;
    score: number;
  }) {
    if (!params.isCorrect) return;

    await updateChallenge({
      userId: params.userId,
      challengeType: dailyType(params.type),
      userTable: "users_daily_challenges",
      challengeTable: "daily_challenges",
      score: params.score,
    });

    await updateChallenge({
      userId: params.userId,
      challengeType: weeklyType(params.type),
      userTable: "users_weekly_challenges",
      challengeTable: "weekly_challenge",
      score: params.score,
    });
  }
}