import { getQuestions } from "../services/questionService";
import { getAnsweredQuestionIds } from "../services/AnswerService";

export async function selectQuestions(
  limit = 10,
  telegramId = 123456789,
  gameMode = "general_knowledge"
) {
  const answeredIds = await getAnsweredQuestionIds(telegramId, gameMode);

  const { data, error } = await getQuestions();

  if (error) {
    console.error("Select Questions Error:", error);
    return [];
  }

  const availableQuestions = (data || []).filter(
    (question) => !answeredIds.includes(question.id)
  );

  return availableQuestions.slice(0, limit);
}