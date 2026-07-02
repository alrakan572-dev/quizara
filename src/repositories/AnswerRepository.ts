import { supabase } from "../lib/supabase";

export class AnswerRepository {
  static async create(answer: {
    telegram_id: number;
    question_id: number;
    source: string;
    is_correct: boolean;
    points_earned: number;
    game_mode: string;
  }) {
    return await supabase
      .from("user_answered_questions")
      .insert({
        telegram_id: answer.telegram_id,
        question_id: answer.question_id,
        source: answer.source,
        is_correct: answer.is_correct,
        points_earned: answer.points_earned,
        game_mode: answer.game_mode,
        answered_at: new Date().toISOString(),
      })
      .select()
      .single();
  }

  static async getAnsweredQuestionIds(
    telegramId: number,
    gameMode: string
  ) {
    return await supabase
      .from("user_answered_questions")
      .select("question_id")
      .eq("telegram_id", telegramId)
      .eq("game_mode", gameMode);
  }
}