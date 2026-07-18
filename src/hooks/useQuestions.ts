import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { QuestionEngine } from "../core/QuestionEngine";

export function useQuestions(language = "en") {
  const { user } = useAuth();
  const telegramId = user?.telegram_id ?? null;
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function loadQuestion() {
    setLoading(true);
    setResult(null);

    const data = await QuestionEngine.loadQuestion(language);

    setQuestion(data);
    setLoading(false);
  }

  useEffect(() => {
    void loadQuestion();
  }, [language]);

  async function submitAnswer(selectedAnswer: string) {
    if (!telegramId || !question || answering) return null;

    setAnswering(true);

    try {
      const answerResult = await QuestionEngine.submitAnswer(
        telegramId,
        question,
        selectedAnswer,
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
