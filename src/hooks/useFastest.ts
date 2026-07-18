import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { FastestEngine } from "../core/FastestEngine";

export function useFastest(language = "en") {
  const { user } = useAuth();
  const telegramId = user?.telegram_id ?? null;
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  async function loadQuestion() {
    setLoading(true);
    setResult(null);

    const data = await FastestEngine.loadQuestion(language);

    setQuestion(data);
    setStartTime(Date.now());
    setLoading(false);
  }

  useEffect(() => {
    void loadQuestion();
  }, [language]);

  async function submitAnswer(selectedAnswer: string) {
    if (!telegramId || !question || answering) return null;

    setAnswering(true);

    try {
      const answerTimeMs = Date.now() - startTime;
      const answerResult = await FastestEngine.submitAnswer(
        telegramId,
        question,
        selectedAnswer,
        answerTimeMs,
      );

      setResult(answerResult);
      return answerResult;
    } finally {
      setAnswering(false);
    }
  }

  return {
    question,
    loading,
    answering,
    result,
    loadQuestion,
    submitAnswer,
  };
}
