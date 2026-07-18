import type { Riddle } from "../types/index.ts";
import { createSupabaseAdminClient } from "./supabaseAdmin.ts";

export async function riddleExists(params: {
  apiId: string;
  source: string;
}) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("riddles")
    .select("id")
    .eq("api_id", params.apiId)
    .eq("source", params.source)
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
}

export async function insertRiddle(params: {
  riddle: Riddle;
  apiId: string;
  source: string;
}) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("riddles").insert({
    question: params.riddle.question,
    correct_answer: params.riddle.answer,
    difficulty: params.riddle.difficulty,
    points: params.riddle.points,
    active: params.riddle.active,
    language: params.riddle.language,
    source: params.source,
    api_id: params.apiId,
    used_count: 0,
    imported_at: new Date().toISOString(),
  });

  if (error) throw error;

  return true;
}