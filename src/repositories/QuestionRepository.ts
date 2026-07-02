import { supabase } from "../lib/supabase";
import type { NormalizedQuestion } from "../types/question";

export class QuestionRepository {

  static async getAll() {
    return await supabase
      .from("questions")
      .select("*")
      .eq("active", true);
  }

  static async getRandom(limit = 10) {
    return await supabase
      .from("questions")
      .select("*")
      .eq("active", true)
      .limit(limit);
  }

  static async getById(id: number) {
    return await supabase
      .from("questions")
      .select("*")
      .eq("id", id)
      .single();
  }

  static async getByCategory(category: string, limit = 10) {
    return await supabase
      .from("questions")
      .select("*")
      .eq("active", true)
      .eq("category", category)
      .limit(limit);
  }
static async getByQuestionText(question: string) {
  return await supabase
    .from("questions")
    .select("id")
    .eq("question", question)
    .limit(1);
}
  static async insert(question: NormalizedQuestion) {
    return await supabase
      .from("questions")
      .insert(question)
      .select()
      .single();
  }

}