import { supabase } from "../lib/supabase";

export const AdsRewardRepository = {
  async createReward(data: {
    telegram_id: number;
    reward_type: string;
    reward_value: number;
    ad_provider: string;
  }) {
    return await supabase
      .from("ads_rewards")
      .insert(data)
      .select()
      .single();
  },

  async getUserRewardsToday(
    telegramId: number
  ) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return await supabase
      .from("ads_rewards")
      .select("*")
      .eq("telegram_id", telegramId)
      .gte("created_at", startOfDay.toISOString());
  },

  async countUserRewardsToday(
    telegramId: number
  ) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return await supabase
      .from("ads_rewards")
      .select("*", { count: "exact", head: true })
      .eq("telegram_id", telegramId)
      .gte("created_at", startOfDay.toISOString());
  },
};