import { useEffect, useState } from "react";
import { RiddlesEngine } from "../core/RiddlesEngine";

export function useRiddles(
  telegramId = 123456789,
  language = "en"
) {
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
    loadRiddle();
  }, [language]);

  async function submitAnswer(answer: string) {
    if (!riddle || answering) return null;

    setAnswering(true);

    const answerResult = await RiddlesEngine.submitAnswer(
      telegramId,
      riddle,
      answer
    );

    setResult(answerResult);
    setAnswering(false);

    return answerResult;
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