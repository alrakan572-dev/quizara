import { FindDifferenceService } from "../services/FindDifferenceService";
import { emitGameEvent } from "./EventEngine";

export class FindDifferenceEngine {
  static async loadImage(language = "en") {
    return await FindDifferenceService.getImage(language);
  }

  static async finishGame(
    telegramId: number,
    image: any,
    foundCount: number,
    answerTimeMs: number
  ) {
    const result = await FindDifferenceService.finishGame(
      telegramId,
      image,
      foundCount,
      answerTimeMs
    );

    await emitGameEvent({
      type: result.isCorrect
        ? "complete_find_difference"
        : "answer_wrong",
      telegramId,
      points: result.earnedPoints,
    });

    return result;
  }
}