import { QuestionService } from "../services/QuestionService";
import { emitGameEvent } from "./EventEngine";

export class QuestionEngine {
  static async loadQuestion(language = "en") {
    return await QuestionService.getQuestion(language);
  }

  static async submitAnswer(
    telegramId: number,
    question: any,
    selectedAnswer: string
  ) {
    const result = await QuestionService.answerQuestion(
      telegramId,
      question,
      selectedAnswer
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