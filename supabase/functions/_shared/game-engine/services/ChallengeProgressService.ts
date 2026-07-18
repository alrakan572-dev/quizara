import type { GameType } from "../core/GameTypes.ts";
import { ChallengesRepo } from "../repositories/ChallengesRepo.ts";

export class ChallengeProgressService {
  static async recordAnswer(params: {
    userId: number;
    type: GameType;
    isCorrect: boolean;
    points: number;
  }): Promise<void> {
    if (!params.isCorrect) {
      return;
    }

    await ChallengesRepo.updateProgress({
      userId: params.userId,
      type: params.type,
      isCorrect: params.isCorrect,
      score: params.points,
    });
  }
}