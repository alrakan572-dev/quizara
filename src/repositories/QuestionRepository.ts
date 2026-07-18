import { supabase } from "../lib/supabase";

export const QuestionRepository = {
  async getRandomQuestion(language = "en") {
    return await supabase
      .from("questions")
      .select("*")
      .eq("active", true)
      .eq("language", language)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
  },

  async getQuestionById(id: number) {
    return await supabase
      .from("questions")
      .select("*")
      .eq("id", id)
      .single();
  },

  async saveAnsweredQuestion(data: {
    telegram_id: number;
    question_id: number;
    source: string;
    is_correct: boolean;
    points_earned: number;
    game_mode: string;
  }) {
    return await supabase
      .from("user_answered_questions")
      .insert(data)
      .select()
      .single();
  },

  async getAnsweredQuestions(telegramId: number) {
    return await supabase
      .from("user_answered_questions")
      .select("question_id")
      .eq("telegram_id", telegramId);
  },

  async increaseQuestionUsage(questionId: number) {
    return await supabase.rpc("increment_question_used_count", {
      question_id_input: questionId,
    });
  },

  async getQuestionCount(language = "en") {
    return await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("active", true)
      .eq("language", language);
  },
};