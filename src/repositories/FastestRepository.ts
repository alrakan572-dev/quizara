import { supabase } from "../lib/supabase";

export const FastestRepository = {
  async getRandomQuestion(language = "en") {
    return await supabase
      .from("fastest")
      .select("*")
      .eq("active", true)
      .eq("language", language)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
  },

  async saveAnsweredFastest(data: {
    telegram_id: number;
    fastest_id: number;
    selected_answer: string;
    is_correct: boolean;
    points_earned: number;
    answer_time_ms: number;
  }) {
    return await supabase
      .from("user_answered_fastest")
      .insert(data)
      .select()
      .single();
  },

  async getAnsweredFastest(telegramId: number) {
    return await supabase
      .from("user_answered_fastest")
      .select("fastest_id")
      .eq("telegram_id", telegramId);
  },
};