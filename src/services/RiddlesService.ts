import { RiddlesRepository } from "../repositories/RiddlesRepository";
import { giveReward } from "./RewardService";

function normalizeAnswer(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export class RiddlesService {
  static async getRiddle(language = "en") {
    const { data, error } =
      await RiddlesRepository.getRandomRiddle(language);

    if (error) {
      console.error("Riddle Error:", error);
      return null;
    }

    return data;
  }

  static async answerRiddle(
    telegramId: number,
    riddle: any,
    userAnswer: string
  ) {
    const correctAnswerText = String(
      riddle?.correct_answer ??
      riddle?.answer ??
      ""
    ).trim();

    const userAnswerText = String(userAnswer ?? "").trim();

    if (!correctAnswerText) {
      console.error("Missing correct answer in riddle:", riddle);

      return {
        isCorrect: false,
        earnedPoints: 0,
        correctAnswer: "Missing correct answer",
      };
    }

    if (!userAnswerText) {
      return {
        isCorrect: false,
        earnedPoints: 0,
        correctAnswer: correctAnswerText,
      };
    }

    const isCorrect =
      normalizeAnswer(userAnswerText) ===
      normalizeAnswer(correctAnswerText);

    const earnedPoints = isCorrect
      ? Number(riddle?.points ?? 10)
      : 0;

    if (isCorrect && earnedPoints > 0) {
      await giveReward(telegramId, {
        type: "points",
        value: earnedPoints,
      });
    }

    await RiddlesRepository.saveAnsweredRiddle({
      telegram_id: telegramId,
      riddle_id: riddle.id,
      is_correct: isCorrect,
      points_earned: earnedPoints,
    });

    return {
      isCorrect,
      earnedPoints,
      correctAnswer: correctAnswerText,
    };
  }
}