import type { Question } from "../types/index.ts";
import { createSupabaseAdminClient } from "./supabaseAdmin.ts";

export async function questionExists(params: {
  apiId: string;
  source: string;
}) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .eq("api_id", params.apiId)
    .eq("source", params.source)
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
}

export async function insertQuestion(params: {
  question: Question;
  apiId: string;
  source: string;
}) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("questions").insert({
    question: params.question.question,
    option_a: params.question.option_a,
    option_b: params.question.option_b,
    option_c: params.question.option_c,
    option_d: params.question.option_d,
    correct_answer: params.question.correct_answer,
    difficulty: params.question.difficulty,
    points: params.question.points,
    active: params.question.active,
    category: params.question.category,
    source: params.source,
    api_id: params.apiId,
    language: params.question.language,
    used_count: 0,
    imported_at: new Date().toISOString(),
  });

  if (error) throw error;

  return true;
}