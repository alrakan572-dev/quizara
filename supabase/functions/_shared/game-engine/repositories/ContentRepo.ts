import { gameClient } from "./GameClient.ts";
import type { GameType, Language, Difficulty } from "../core/GameTypes.ts";

export function contentTable(type: GameType) {
  if (type === "quiz") return "questions";
  if (type === "riddle") return "riddles";
  if (type === "fastest") return "fastest";
  return "find_the_difference";
}

export class ContentRepo {
  static async getById(type: GameType, itemId: number) {
    const { data, error } = await gameClient()
      .from(contentTable(type))
      .select("*")
      .eq("id", itemId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getActive(params: {
    type: GameType;
    language: Language;
    category?: string;
    difficulty?: Difficulty;
    limit?: number;
  }) {
    let query = gameClient()
      .from(contentTable(params.type))
      .select("*")
      .eq("active", true)
      .eq("language", params.language)
      .limit(params.limit ?? 200);

    if (params.type === "quiz" && params.category) {
      query = query.eq("category", params.category);
    }

    if (params.difficulty) {
      query = query.eq("difficulty", params.difficulty);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data ?? [];
  }

  static async incrementUsed(type: GameType, item: any) {
    const { error } = await gameClient()
      .from(contentTable(type))
      .update({
        used_count: Number(item.used_count ?? 0) + 1,
      })
      .eq("id", item.id);

    if (error) throw error;
  }
}