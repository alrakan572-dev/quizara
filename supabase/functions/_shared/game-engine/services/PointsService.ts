import type {
  Difficulty,
  GameType,
} from "../core/GameTypes.ts";
import { GameEngineError } from "../core/GameErrors.ts";
import { SettingsRepo } from "../repositories/SettingsRepo.ts";

export class PointsService {
  static async calculate(params: {
    type: GameType;
    difficulty: Difficulty;
    isCorrect: boolean;
  }): Promise<number> {
    if (!params.isCorrect) {
      return 0;
    }

    const points = await SettingsRepo.points(
      params.type,
      params.difficulty,
    );

    if (!Number.isFinite(points) || points < 0) {
      throw new GameEngineError(
        "Invalid points configuration",
        "INVALID_POINTS_CONFIGURATION",
        {
          type: params.type,
          difficulty: params.difficulty,
          points,
        },
      );
    }

    return Math.floor(points);
  }
}