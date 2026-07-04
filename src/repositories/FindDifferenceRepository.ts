import { supabase } from "../lib/supabase";

export const FindDifferenceRepository = {
  async getRandomImage(language = "en") {
    return await supabase
      .from("find_the_difference")
      .select("*")
      .eq("active", true)
      .eq("language", language)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
  },

  async saveAnsweredImage(data: {
    telegram_id: number;
    match_image_id: number;
    is_correct: boolean;
    points_earned: number;
    answer_time_ms: number;
  }) {
    return await supabase
      .from("user_answered_match_images")
      .insert(data)
      .select()
      .single();
  },

  async getAnsweredImages(telegramId: number) {
    return await supabase
      .from("user_answered_match_images")
      .select("match_image_id")
      .eq("telegram_id", telegramId);
  },
};