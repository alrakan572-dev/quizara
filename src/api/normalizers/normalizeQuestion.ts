import type { NormalizedQuestion } from "../interfaces/ContentProvider";

function decodeHtml(value: string) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function shuffleArray<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function normalizeOpenTriviaQuestion(
  item: any,
  language = "en"
): NormalizedQuestion {
  const options = shuffleArray([
    item.correct_answer,
    ...(item.incorrect_answers ?? []),
  ]).map((option) => decodeHtml(String(option)));

  return {
    question: decodeHtml(String(item.question ?? "")),
    option_a: options[0] ?? "",
    option_b: options[1] ?? "",
    option_c: options[2] ?? "",
    option_d: options[3] ?? "",
    correct_answer: decodeHtml(String(item.correct_answer ?? "")),
    difficulty: item.difficulty ?? "easy",
    points: item.difficulty === "hard" ? 30 : item.difficulty === "medium" ? 20 : 10,
    active: true,
    category: item.category ?? "general",
    source: "open_trivia",
    api_id: `${item.category}-${item.question}`,
    language,
  };
}

export function normalizeTheTriviaQuestion(
  item: any,
  language = "en"
): NormalizedQuestion {
  const options = shuffleArray([
    item.correctAnswer,
    ...(item.incorrectAnswers ?? []),
  ]);

  return {
    question: String(item.question ?? ""),
    option_a: options[0] ?? "",
    option_b: options[1] ?? "",
    option_c: options[2] ?? "",
    option_d: options[3] ?? "",
    correct_answer: String(item.correctAnswer ?? ""),
    difficulty: item.difficulty ?? "easy",
    points: item.difficulty === "hard" ? 30 : item.difficulty === "medium" ? 20 : 10,
    active: true,
    category: item.category ?? "general",
    source: "the_trivia_api",
    api_id: item.id ?? String(item.question ?? ""),
    language,
  };
}
export function normalizeQuizApiQuestion(
  item: any,
  language = "en"
): NormalizedQuestion {

  const answers = [
    item.answers?.answer_a,
    item.answers?.answer_b,
    item.answers?.answer_c,
    item.answers?.answer_d,
  ].filter(Boolean);

  const correctKey = Object.keys(
    item.correct_answers ?? {}
  ).find(
    (key) => item.correct_answers[key] === "true"
  );

  const correctAnswer =
    correctKey
      ?.replace("_correct", "")
      ?.replace("answer_", "");

  const answerMap: Record<string, string> = {
    a: item.answers?.answer_a ?? "",
    b: item.answers?.answer_b ?? "",
    c: item.answers?.answer_c ?? "",
    d: item.answers?.answer_d ?? "",
  };

  return {
    question: item.question ?? "",
    option_a: answers[0] ?? "",
    option_b: answers[1] ?? "",
    option_c: answers[2] ?? "",
    option_d: answers[3] ?? "",
    correct_answer: answerMap[correctAnswer ?? ""] ?? "",
    difficulty: item.difficulty ?? "easy",
    points:
      item.difficulty === "Hard"
        ? 30
        : item.difficulty === "Medium"
        ? 20
        : 10,
    active: true,
    category: item.category ?? "general",
    source: "quizapi",
    api_id: String(item.id ?? ""),
    language,
  };
}