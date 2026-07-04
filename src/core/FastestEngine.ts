import { FastestService } from "../services/FastestService";
import { emitGameEvent } from "./EventEngine";

export class FastestEngine {
  static async loadQuestion(language = "en") {
    return await FastestService.getQuestion(language);
  }

  static async submitAnswer(
    telegramId: number,
    question: any,
    selectedAnswer: string,
    answerTimeMs: number
  ) {
    const result = await FastestService.answerQuestion(
      telegramId,
      question,
      selectedAnswer,
      answerTimeMs
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