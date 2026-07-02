import { supabase } from "../lib/supabase";

export class LeaderboardRepository {
  static async upsertUser(leaderboardUser: {
  telegram_id: number;
  username?: string | null;
  points: number;
  level: number;
}) {
  return await supabase
    .from("leaderboard")
    .upsert(
      {
        telegram_id: leaderboardUser.telegram_id,
        username: leaderboardUser.username ?? null,
        total_points: leaderboardUser.points,
        level: leaderboardUser.level,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "telegram_id",
      }
    );
}

  static async getTop(limit = 100) {
    return await supabase
      .from("leaderboard")
      .select("*")
      .order("points", { ascending: false })
      .limit(limit);
  }
}