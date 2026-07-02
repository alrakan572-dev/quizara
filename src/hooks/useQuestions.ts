import { useEffect, useState } from "react";
import { getQuestions } from "../services/questionService";

export function useQuestions() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function loadQuestions() {
      const { data, error } = await getQuestions();

      if (error) {
        setError(error);
      } else {
        setQuestions(data || []);
      }

      setLoading(false);
    }

    loadQuestions();
  }, []);

  return {
    questions,
    loading,
    error,
  };
}