import { supabase } from "../lib/supabase";

export const WeeklyChallengeRepository = {
  async getActive(language: string) {
    return await supabase
      .from("weekly_challenge")
      .select("*")
      .eq("active", true)
      .eq("language", language);
  },

  async getUserProgress(userId: number, challengeId: number) {
    return await supabase
      .from("users_weekly_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .maybeSingle();
  },

  async createUserProgress(data: any) {
    return await supabase
      .from("users_weekly_challenges")
      .insert(data)
      .select()
      .single();
  },

  async updateProgress(
    id: number,
    progress: number,
    completed: boolean
  ) {
    return await supabase
      .from("users_weekly_challenges")
      .update({
        progress,
        completed,
      })
      .eq("id", id);
  },

  async claimReward(id: number) {
    return await supabase
      .from("users_weekly_challenges")
      .update({
        reward_claimed: true,
      })
      .eq("id", id);
  },
};