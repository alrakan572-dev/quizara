import { supabase } from "../lib/supabase";

export class DailyChallengeRepository {
  static async getActiveChallenges(language = "en") {
    return await supabase
      .from("daily_challenges")
      .select("*")
      .eq("active", true)
      .eq("language", language);
  }

  static async getUserChallenge(
    telegramId: number,
    challengeId: number
  ) {
    return await supabase
      .from("users_daily_challenges")
      .select("*")
      .eq("user_id", telegramId)
      .eq("challenge_id", challengeId)
      .single();
  }

  static async createUserChallenge(
    telegramId: number,
    challengeId: number
  ) {
    return await supabase
      .from("users_daily_challenges")
      .insert({
        user_id: telegramId,
        challenge_id: challengeId,
        progress: 0,
        score: 0,
        completed: false,
        reward_claimed: false,
      })
      .select()
      .single();
  }

  static async updateProgress(
    telegramId: number,
    challengeId: number,
    progress: number,
    completed: boolean
  ) {
    return await supabase
      .from("users_daily_challenges")
      .update({
        progress,
        score: progress,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("user_id", telegramId)
      .eq("challenge_id", challengeId);
  }

  static async claimReward(
    telegramId: number,
    challengeId: number
  ) {
    return await supabase
      .from("users_daily_challenges")
      .update({
        reward_claimed: true,
      })
      .eq("user_id", telegramId)
      .eq("challenge_id", challengeId);
  }
}