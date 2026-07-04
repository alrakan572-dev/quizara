import { RiddlesService } from "../services/RiddlesService";
import { emitGameEvent } from "./EventEngine";

export class RiddlesEngine {
  static async loadRiddle(language = "en") {
    return await RiddlesService.getRiddle(language);
  }

  static async submitAnswer(
    telegramId: number,
    riddle: any,
    answer: string
  ) {
    const result = await RiddlesService.answerRiddle(
      telegramId,
      riddle,
      answer
    );

    await emitGameEvent({
      type: result.isCorrect
        ? "answer_correct"
        : "answer_wrong",
      telegramId,
      points: result.earnedPoints,
    });

    return result;
  }
}