import { checkAnswer } from "./AnswerChecker";
import { calculateScore } from "./ScoreCalculator";

export type GameQuestion = {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  points: number;
};

export function getCurrentQuestion(
  questions: GameQuestion[],
  currentIndex: number
) {
  return questions[currentIndex] || null;
}

export function answerQuestion(
  question: GameQuestion,
  selectedAnswer: string
) {
  const isCorrect = checkAnswer(
    selectedAnswer,
    question.correct_answer
  );

  const earnedPoints = calculateScore(
    isCorrect,
    question.points
  );

  return {
    isCorrect,
    earnedPoints,
    correctAnswer: question.correct_answer,
  };
}

export function isGameFinished(
  questions: GameQuestion[],
  currentIndex: number
) {
  return currentIndex >= questions.length - 1;
}