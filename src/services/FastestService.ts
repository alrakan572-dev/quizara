import { FastestRepository } from "../repositories/FastestRepository";
import { giveReward } from "./RewardService";

function normalizeAnswer(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export class FastestService {
  static async getQuestion(language = "en") {
    const { data, error } =
      await FastestRepository.getRandomQuestion(language);

    if (error) {
      console.error("Fastest Error:", error);
      return null;
    }

    return data;
  }

  static async answerQuestion(
    telegramId: number,
    question: any,
    selectedAnswer: string,
    answerTimeMs: number
  ) {
    const correctAnswer = String(
      question?.correct_answer ?? ""
    );

    const isCorrect =
      normalizeAnswer(selectedAnswer) ===
      normalizeAnswer(correctAnswer);

    const earnedPoints = isCorrect
      ? Number(question?.points ?? 0)
      : 0;

    if (isCorrect && earnedPoints > 0) {
      await giveReward(telegramId, {
        type: "points",
        value: earnedPoints,
      });
    }

    await FastestRepository.saveAnsweredFastest({
      telegram_id: telegramId,
      fastest_id: question.id,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      points_earned: earnedPoints,
      answer_time_ms: answerTimeMs,
    });

    return {
      isCorrect,
      earnedPoints,
      correctAnswer,
    };
  }
}