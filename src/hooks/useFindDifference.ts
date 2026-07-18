import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { FindDifferenceEngine } from "../core/FindDifferenceEngine";

export function useFindDifference(language = "en") {
  const { user } = useAuth();
  const telegramId = user?.telegram_id ?? null;
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [foundCount, setFoundCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());

  async function loadImage() {
    setLoading(true);
    setResult(null);
    setFoundCount(0);

    const data = await FindDifferenceEngine.loadImage(language);

    setImage(data);
    setStartTime(Date.now());
    setLoading(false);
  }

  useEffect(() => {
    void loadImage();
  }, [language]);

  function addFoundDifference() {
    setFoundCount((previous) => previous + 1);
  }

  async function finishGame() {
    if (!telegramId || !image || finishing) return null;

    setFinishing(true);

    try {
      const answerTimeMs = Date.now() - startTime;
      const finishResult = await FindDifferenceEngine.finishGame(
        telegramId,
        image,
        foundCount,
        answerTimeMs,
      );

      setResult(finishResult);
      return finishResult;
    } finally {
      setFinishing(false);
    }
  }

  return {
    image,
    loading,
    finishing,
    result,
    foundCount,
    loadImage,
    addFoundDifference,
    finishGame,
  };
}
