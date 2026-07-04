import { useEffect, useState } from "react";
import { FastestEngine } from "../core/FastestEngine";

export function useFastest(
  telegramId = 123456789,
  language = "en"
) {
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
    loadQuestion();
  }, [language]);

  async function submitAnswer(selectedAnswer: string) {
    if (!question || answering) return null;

    setAnswering(true);

    const answerTimeMs = Date.now() - startTime;

    const answerResult = await FastestEngine.submitAnswer(
      telegramId,
      question,
      selectedAnswer,
      answerTimeMs
    );

    setResult(answerResult);
    setAnswering(false);

    return answerResult;
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