import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { RiddlesEngine } from "../core/RiddlesEngine";

export function useRiddles(language = "en") {
  const { user } = useAuth();
  const telegramId = user?.telegram_id ?? null;
  const [riddle, setRiddle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function loadRiddle() {
    setLoading(true);
    setResult(null);

    const data = await RiddlesEngine.loadRiddle(language);

    setRiddle(data);
    setLoading(false);
  }

  useEffect(() => {
    void loadRiddle();
  }, [language]);

  async function submitAnswer(answer: string) {
    if (!telegramId || !riddle || answering) return null;

    setAnswering(true);

    try {
      const answerResult = await RiddlesEngine.submitAnswer(
        telegramId,
        riddle,
        answer,
      );

      setResult(answerResult);
      return answerResult;
    } finally {
      setAnswering(false);
    }
  }

  return {
    riddle,
    loading,
    answering,
    result,
    loadRiddle,
    submitAnswer,
  };
}
