import { supabase } from "../lib/supabase";

export class UserRepository {
  static async getByTelegramId(telegramId: number) {
    return await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();
  }

  static async create(user: {
    telegram_id: number;
    username?: string | null;
    first_name?: string | null;
    photo_url?: string | null;
  }) {
    const payload = {
      telegram_id: user.telegram_id,
      username: user.username ?? null,
      first_name: user.first_name ?? null,
      photo_url: user.photo_url ?? null,
      points: 0,
      coins: 0,
      vip: false,
      level: 1,
      games_played: 0,
      hints: 0,
      extra_spins: 0,
      total_correct: 0,
      total_wrong: 0,
      last_login: new Date().toISOString(),
    };

    return await supabase
      .from("users")
      .insert(payload)
      .select()
      .single();
  }

  static async updateLastLogin(telegramId: number) {
    return await supabase
      .from("users")
      .update({
        last_login: new Date().toISOString(),
      })
      .eq("telegram_id", telegramId);
  }

  static async updatePoints(telegramId: number, points: number) {
    return await supabase
      .from("users")
      .update({
        points,
      })
      .eq("telegram_id", telegramId);
  }

  static async updatePointsAndLevel(
    telegramId: number,
    points: number,
    level: number
  ) {
    return await supabase
      .from("users")
      .update({
        points,
        level,
      })
      .eq("telegram_id", telegramId);
  }
  static async updateStatsAfterAnswer(
  telegramId: number,
  isCorrect: boolean
) {
  const { data: user, error } = await supabase
    .from("users")
    .select("games_played,total_correct,total_wrong")
    .eq("telegram_id", telegramId)
    .single();

  if (error) return { data: null, error };

  return await supabase
    .from("users")
    .update({
      games_played: (user.games_played ?? 0) + 1,
      total_correct: (user.total_correct ?? 0) + (isCorrect ? 1 : 0),
      total_wrong: (user.total_wrong ?? 0) + (isCorrect ? 0 : 1),
      last_login: new Date().toISOString(),
    })
    .eq("telegram_id", telegramId);
}
}