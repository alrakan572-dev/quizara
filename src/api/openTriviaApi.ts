export type OpenTriviaQuestion = {
  type: string;
  difficulty: string;
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

export async function fetchOpenTriviaQuestions(amount = 10) {
  const url = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch questions from Open Trivia DB");
  }

  const result = await response.json();

  return result.results as OpenTriviaQuestion[];
}