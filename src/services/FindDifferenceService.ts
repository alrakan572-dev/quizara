import { FindDifferenceRepository } from "../repositories/FindDifferenceRepository";
import { giveReward } from "./RewardService";

export class FindDifferenceService {
  static async getImage(language = "en") {
    const { data, error } =
      await FindDifferenceRepository.getRandomImage(language);

    if (error) {
      console.error("FindDifference Error:", error);
      return null;
    }

    return data;
  }

  static async finishGame(
    telegramId: number,
    image: any,
    foundCount: number,
    answerTimeMs: number
  ) {
    const requiredCount = Number(image?.differences_count ?? 0);

    const isCorrect = foundCount >= requiredCount;

    const earnedPoints = isCorrect
      ? Number(image?.points ?? 0)
      : 0;

    if (isCorrect && earnedPoints > 0) {
      await giveReward(telegramId, {
        type: "points",
        value: earnedPoints,
      });
    }

    await FindDifferenceRepository.saveAnsweredImage({
      telegram_id: telegramId,
      match_image_id: image.id,
      is_correct: isCorrect,
      points_earned: earnedPoints,
      answer_time_ms: answerTimeMs,
    });

    return {
      isCorrect,
      earnedPoints,
      requiredCount,
      foundCount,
    };
  }
}