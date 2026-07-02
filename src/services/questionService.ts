import type { NormalizedQuestion } from "../types/question";
import { fetchOpenTriviaQuestions } from "../api/openTriviaApi";
import { normalizeOpenTriviaQuestion } from "../api/normalizeQuestion";
import { QuestionRepository } from "../repositories/QuestionRepository";

export async function getQuestions() {
  return await QuestionRepository.getAll();
}

export async function getRandomQuestions(limit = 10) {
  return await QuestionRepository.getRandom(limit);
}

export async function getQuestionById(id: number) {
  return await QuestionRepository.getById(id);
}

export async function getQuestionsByCategory(category: string, limit = 10) {
  return await QuestionRepository.getByCategory(category, limit);
}

export async function questionExists(question: string) {
  const { data, error } = await QuestionRepository.getByQuestionText(question);

  if (error) {
    console.error("Question Exists Error:", error);
    return false;
  }

  return data.length > 0;
}

export async function saveQuestion(question: NormalizedQuestion) {
  const exists = await questionExists(question.question);

  if (exists) {
    return { data: null, error: null, skipped: true };
  }

  const { data, error } = await QuestionRepository.insert(question);

  if (error) {
    console.error("Save Question Error:", error);
    console.log("Question Payload:", question);
  }

  return { data, error, skipped: false };
}

export async function saveQuestions(questions: NormalizedQuestion[]) {
  const results = [];

  for (const question of questions) {
    const result = await saveQuestion(question);
    results.push(result);
  }

  return results;
}

export async function importFromOpenTrivia(amount = 10) {
  const rawQuestions = await fetchOpenTriviaQuestions(amount);
  const normalizedQuestions = rawQuestions.map(normalizeOpenTriviaQuestion);
  return await saveQuestions(normalizedQuestions);
}