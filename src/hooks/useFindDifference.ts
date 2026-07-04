import { useEffect, useState } from "react";
import { FindDifferenceEngine } from "../core/FindDifferenceEngine";

export function useFindDifference(
  telegramId = 123456789,
  language = "en"
) {
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
    loadImage();
  }, [language]);

  function addFoundDifference() {
    setFoundCount((prev) => prev + 1);
  }

  async function finishGame() {
    if (!image || finishing) return null;

    setFinishing(true);

    const answerTimeMs = Date.now() - startTime;

    const finishResult = await FindDifferenceEngine.finishGame(
      telegramId,
      image,
      foundCount,
      answerTimeMs
    );

    setResult(finishResult);
    setFinishing(false);

    return finishResult;
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