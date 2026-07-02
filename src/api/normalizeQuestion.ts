import type { NormalizedQuestion } from "../types/question";
import type { OpenTriviaQuestion } from "./openTriviaApi";

function decodeHtml(text: string) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function shuffleArray<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function getPoints(difficulty: string) {
  if (difficulty === "hard") return 20;
  if (difficulty === "medium") return 10;
  return 5;
}

export function normalizeOpenTriviaQuestion(
  item: OpenTriviaQuestion
): NormalizedQuestion {
  const correct = decodeHtml(item.correct_answer);

  const options = shuffleArray([
    correct,
    ...item.incorrect_answers.map(decodeHtml),
  ]);

  return {
    question: decodeHtml(item.question),
    option_a: options[0],
    option_b: options[1],
    option_c: options[2],
    option_d: options[3],
    correct_answer: correct,
    difficulty: item.difficulty as NormalizedQuestion["difficulty"],
    points: getPoints(item.difficulty),
    category: decodeHtml(item.category),
    language: "en",
    source: "open_trivia_db",
    active: true,
  };
}