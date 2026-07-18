import { gameClient } from "./GameClient.ts";
import { GameEngineError } from "../core/GameErrors.ts";

export type LeaderboardRow = {
  id: number;
  telegram_id: number;
  username: string | null;
  total_points: number;
  rank: number;
  level: number | null;
  vip: boolean;
  photo_url: string | null;
  updated_at: string;
};

export class LeaderboardRepo {
  static async addScore(params: {
    user: any;
    points: number;
  }): Promise<void> {
    if (params.points <= 0) return;

    const client = gameClient();

    const { data: existing, error: findError } = await client
      .from("leaderboard")
      .select("id,total_points")
      .eq("telegram_id", params.user.telegram_id)
      .maybeSingle();

    if (findError) throw findError;

    if (existing?.id) {
      const { error } = await client
        .from("leaderboard")
        .update({
          total_points:
            Number(existing.total_points ?? 0) + params.points,
          username: params.user.username,
          photo_url: params.user.photo_url,
          level: params.user.level,
          vip: params.user.vip,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) throw error;
      return;
    }

    const { error } = await client
      .from("leaderboard")
      .insert({
        telegram_id: params.user.telegram_id,
        username: params.user.username,
        photo_url: params.user.photo_url,
        level: params.user.level,
        vip: params.user.vip,
        total_points: params.points,
        rank: 0,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  static async page(params: {
    limit: number;
    offset: number;
  }): Promise<{
    rows: LeaderboardRow[];
    total: number;
  }> {
    const from = params.offset;
    const to = params.offset + params.limit - 1;

    const { data, error, count } = await gameClient()
      .from("leaderboard")
      .select(
        "id,telegram_id,username,total_points,rank,level,vip,photo_url,updated_at",
        { count: "exact" },
      )
      .order("total_points", { ascending: false })
      .order("updated_at", { ascending: true })
      .range(from, to);

    if (error) throw error;

    return {
      rows: (data ?? []) as LeaderboardRow[],
      total: Number(count ?? 0),
    };
  }

  static async getByTelegramId(
    telegramId: number,
  ): Promise<LeaderboardRow | null> {
    const { data, error } = await gameClient()
      .from("leaderboard")
      .select(
        "id,telegram_id,username,total_points,rank,level,vip,photo_url,updated_at",
      )
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (error) throw error;

    return data as LeaderboardRow | null;
  }

  static async getCalculatedRank(
    telegramId: number,
  ): Promise<{
    row: LeaderboardRow;
    rank: number;
  } | null> {
    const row = await this.getByTelegramId(telegramId);

    if (!row) return null;

    const { count, error } = await gameClient()
      .from("leaderboard")
      .select("id", {
        count: "exact",
        head: true,
      })
      .gt("total_points", Number(row.total_points ?? 0));

    if (error) throw error;

    return {
      row,
      rank: Number(count ?? 0) + 1,
    };
  }

  static async getUserTelegramId(
    userId: number,
  ): Promise<number> {
    const { data, error } = await gameClient()
      .from("users")
      .select("telegram_id")
      .eq("id", userId)
      .single();

    if (error) throw error;

    const telegramId = Number(data?.telegram_id);

    if (!Number.isSafeInteger(telegramId)) {
      throw new GameEngineError(
        "User telegram_id is invalid",
        "INVALID_TELEGRAM_ID",
      );
    }

    return telegramId;
  }
}