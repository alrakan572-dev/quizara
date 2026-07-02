import { supabase } from "../lib/supabase";

export const LuckyBoxRepository = {
  async getRewards() {
    return await supabase
      .from("luck_box")
      .select("*")
      .eq("active", true);
  },

  async getRewardById(id: number) {
    return await supabase
      .from("luck_box")
      .select("*")
      .eq("id", id)
      .single();
  },

  async saveHistory(data: {
    telegram_id: number;
    reward_type: string;
    reward_value: number;
    reward_id: number;
  }) {
    return await supabase
      .from("user_luckybox_history")
      .insert(data);
  },
};