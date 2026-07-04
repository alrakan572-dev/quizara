import { supabase } from "../lib/supabase";

export const RiddlesRepository = {
  async getRandomRiddle(language = "en") {
    return await supabase
      .from("riddles")
      .select("*")
      .eq("active", true)
      .eq("language", language)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
  },

  async getRiddleById(id: number) {
    return await supabase
      .from("riddles")
      .select("*")
      .eq("id", id)
      .single();
  },

  async getAnsweredRiddles(telegramId: number) {
    return await supabase
      .from("user_answered_riddles")
      .select("riddle_id")
      .eq("telegram_id", telegramId);
  },

  async saveAnsweredRiddle(data: {
    telegram_id: number;
    riddle_id: number;
    is_correct: boolean;
    points_earned: number;
  }) {
    return await supabase
      .from("user_answered_riddles")
      .insert(data)
      .select()
      .single();
  },
};