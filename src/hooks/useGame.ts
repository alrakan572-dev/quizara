import { useEffect, useState } from "react";
import { selectQuestions } from "../game/QuestionSelector";
import {
  answerQuestion,
  getCurrentQuestion,
  isGameFinished,
  type GameQuestion,
} from "../game/GameEngine";
import { DEFAULT_QUESTION_TIME } from "../game/Timer";
import { saveUserAnswer } from "../services/answerService";
import { addUserPoints } from "../services/userService";
import { emitGameEvent } from "../core/EventEngine";

export function useGame(limit = 10) {
  const telegramId = 123456789;

  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastResult, setLastResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_QUESTION_TIME);

  useEffect(() => {
    async function start() {
      const data = await selectQuestions(limit, telegramId, "general_knowledge");
      setQuestions(data);
      setLoading(false);
      setTimeLeft(DEFAULT_QUESTION_TIME);
    }

    start();
  }, [limit]);

  const currentQuestion = getCurrentQuestion(questions, currentIndex);

  function goNextQuestion() {
    if (isGameFinished(questions, currentIndex)) {
      setFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(DEFAULT_QUESTION_TIME);
      setLastResult(null);
    }
  }

  useEffect(() => {
    if (loading || finished || !currentQuestion) return;

    if (timeLeft <= 0) {
      setLastResult({
        isCorrect: false,
        earnedPoints: 0,
        correctAnswer: currentQuestion.correct_answer,
        timedOut: true,
      });

      goNextQuestion();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, finished, currentQuestion]);

  async function submitAnswer(selectedAnswer: string) {
    if (!currentQuestion || finished) return;

    const result = answerQuestion(currentQuestion, selectedAnswer);

    setLastResult(result);
    setScore((prev) => prev + result.earnedPoints);

    await saveUserAnswer({
      telegram_id: telegramId,
      question_id: currentQuestion.id,
      source: "questions",
      is_correct: result.isCorrect,
      points_earned: result.earnedPoints,
      game_mode: "general_knowledge",
    });

    if (result.earnedPoints > 0) {
      await addUserPoints(telegramId, result.earnedPoints);
    } 
    await emitGameEvent({
   type: result.isCorrect ? "answer_correct" : "answer_wrong",
   telegramId,
   points: result.earnedPoints,
  });
    goNextQuestion();
  }

  return {
    questions,
    currentQuestion,
    currentIndex,
    score,
    finished,
    loading,
    lastResult,
    timeLeft,
    submitAnswer,
  };
}