import { GameEngineError } from "../core/GameErrors.ts";
import { LeaderboardRepo } from "../repositories/LeaderboardRepo.ts";

export class LeaderboardService {
  static async recordScore(params: {
    user: any;
    points: number;
  }): Promise<void> {
    if (params.points <= 0) return;

    await LeaderboardRepo.addScore({
      user: params.user,
      points: params.points,
    });
  }

  static async getLeaderboard(params: {
    userId?: number;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(
      Math.max(Math.trunc(Number(params.limit ?? 20)), 1),
      100,
    );

    const offset = Math.max(
      Math.trunc(Number(params.offset ?? 0)),
      0,
    );

    if (!Number.isSafeInteger(limit)) {
      throw new GameEngineError(
        "Invalid leaderboard limit",
        "INVALID_LIMIT",
      );
    }

    if (!Number.isSafeInteger(offset)) {
      throw new GameEngineError(
        "Invalid leaderboard offset",
        "INVALID_OFFSET",
      );
    }

    const page = await LeaderboardRepo.page({
      limit,
      offset,
    });

    const leaders = page.rows.map((row, index) => ({
      rank: offset + index + 1,
      telegram_id: row.telegram_id,
      username: row.username,
      total_points: Number(row.total_points ?? 0),
      level: row.level,
      vip: row.vip,
      photo_url: row.photo_url,
    }));

    let currentUser = null;

    if (params.userId !== undefined) {
      if (
        !Number.isSafeInteger(params.userId) ||
        Number(params.userId) <= 0
      ) {
        throw new GameEngineError(
          "Invalid user_id",
          "INVALID_USER_ID",
        );
      }

      const telegramId =
        await LeaderboardRepo.getUserTelegramId(
          Number(params.userId),
        );

      const current =
        await LeaderboardRepo.getCalculatedRank(
          telegramId,
        );

      if (current) {
        currentUser = {
          rank: current.rank,
          telegram_id: current.row.telegram_id,
          username: current.row.username,
          total_points: Number(
            current.row.total_points ?? 0,
          ),
          level: current.row.level,
          vip: current.row.vip,
          photo_url: current.row.photo_url,
        };
      }
    }

    return {
      scope: "global",
      leaders,
      current_user: currentUser,
      pagination: {
        limit,
        offset,
        total: page.total,
        has_more: offset + leaders.length < page.total,
      },
    };
  }
}