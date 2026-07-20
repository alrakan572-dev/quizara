import { QuestionRepository } from "../repositories/QuestionRepository";
import { giveReward } from "./RewardService";

export class QuestionService {
  static async getQuestion(language = "en") {
    const { data, error } =
      await QuestionRepository.getRandomQuestion(language);

    if (error) {
      console.error("Question Error:", error);
      return null;
    }

    return data;
  }

  static async answerQuestion(
    telegramId: number,
    question: any,
    selectedAnswer: string
  ) {
    const correctAnswer = String(
      question?.correct_answer ?? ""
    ).trim();

    const userAnswer = String(
      selectedAnswer ?? ""
    ).trim();

    const isCorrect =
      correctAnswer.toLowerCase() ===
      userAnswer.toLowerCase();

    const earnedPoints = isCorrect
      ? Number(question?.points ?? 10)
      : 0;

    if (isCorrect && earnedPoints > 0) {
      await giveReward(telegramId, {
        type: "points",
        value: earnedPoints,
      });
    }

    await QuestionRepository.saveAnsweredQuestion({
      telegram_id: telegramId,
      question_id: question.id,
      source: question.source ?? "manual",
      is_correct: isCorrect,
      points_earned: earnedPoints,
      game_mode: "general_knowledge",
    });

    await QuestionRepository.increaseQuestionUsage(question.id);

    return {
      isCorrect,
      earnedPoints,
      correctAnswer,
    };
  }
}