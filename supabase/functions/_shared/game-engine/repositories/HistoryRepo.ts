import { gameClient } from "./GameClient.ts";
import type { GameType } from "../core/GameTypes.ts";

function config(type: GameType) {
  if (type === "quiz") {
    return { table: "user_answered_questions", column: "question_id" };
  }

  if (type === "riddle") {
    return { table: "user_answered_riddles", column: "riddle_id" };
  }

  if (type === "fastest") {
    return { table: "user_answered_fastest", column: "fastest_id" };
  }

  return { table: "user_answered_match_images", column: "match_image_id" };
}

export class HistoryRepo {
  static async playedIds(type: GameType, telegramId: number) {
    const c = config(type);

    const { data, error } = await gameClient()
      .from(c.table)
      .select(c.column)
      .eq("telegram_id", telegramId);

    if (error) throw error;

    return new Set((data ?? []).map((row: any) => row[c.column]));
  }

  static async save(params: {
    type: GameType;
    telegramId: number;
    itemId: number;
    isCorrect: boolean;
    points: number;
    answerTimeMs?: number;
  }) {
    const c = config(params.type);

    const payload: Record<string, unknown> = {
      telegram_id: params.telegramId,
      [c.column]: params.itemId,
      is_correct: params.isCorrect,
      points_earned: params.points,
      answer_time_ms: params.answerTimeMs ?? 0,
      answered_at: new Date().toISOString(),
    };

    if (params.type === "quiz") {
      payload.game_mode = "quiz";
    }

    const conflict =
      params.type === "quiz"
        ? "telegram_id,question_id,game_mode"
        : `telegram_id,${c.column}`;

    const { error } = await gameClient()
      .from(c.table)
      .upsert(payload, { onConflict: conflict });

    if (error) throw error;
  }
}