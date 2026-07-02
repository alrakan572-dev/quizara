export type QuestionDifficulty = "easy" | "medium" | "hard";

export type QuestionSource =
  | "open_trivia_db"
  | "the_trivia_api"
  | "quiz_api"
  | "manual";

export type NormalizedQuestion = {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty: QuestionDifficulty;
  points: number;
  category: string;
  language: string;
  source: QuestionSource;
  active: boolean;
};