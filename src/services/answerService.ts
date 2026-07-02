import { AnswerRepository } from "../repositories/AnswerRepository";

export async function saveUserAnswer(answer: {
  telegram_id: number;
  question_id: number;
  source: string;
  is_correct: boolean;
  points_earned: number;
  game_mode: string;
}) {
  return await AnswerRepository.create(answer);
}

export async function getAnsweredQuestionIds(
  telegramId: number,
  gameMode: string
) {
  const { data, error } =
    await AnswerRepository.getAnsweredQuestionIds(
      telegramId,
      gameMode
    );

  if (error) {
    console.error("Get Answered Questions Error:", error);
    return [];
  }

  return data?.map((item) => item.question_id) || [];
}