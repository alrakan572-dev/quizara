import { ContentProviderManager } from "../api/manager/ContentProviderManager";
import { supabase } from "../lib/supabase";

export class ContentImportService {
  static async importQuestions(params: {
    amount?: number;
    language?: string;
    category?: string;
    difficulty?: string;
  } = {}) {
    const result = await ContentProviderManager.fetchQuestions({
      amount: params.amount ?? 10,
      language: params.language ?? "en",
      category: params.category,
      difficulty: params.difficulty,
    });

    if (!result.success || result.items.length === 0) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        source: result.source,
        error: result.error ?? "No questions found",
      };
    }

    let imported = 0;
    let skipped = 0;

    for (const question of result.items) {
      const { data: existing } = await supabase
        .from("questions")
        .select("id")
        .eq("api_id", question.api_id)
        .eq("source", question.source)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error } = await supabase
        .from("questions")
        .insert({
          ...question,
          used_count: 0,
          imported_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Import Question Error:", error);
        skipped++;
        continue;
      }

      imported++;
    }

    return {
      success: true,
      imported,
      skipped,
      source: result.source,
    };
  }
}