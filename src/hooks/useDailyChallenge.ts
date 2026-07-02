import { useEffect, useState } from "react";
import {
  loadDailyChallenges,
  initializeUserChallenge,
  updateDailyChallengeProgress,
  claimDailyChallengeReward,
} from "../services/DailyChallengeService";

export function useDailyChallenge(
  telegramId = 123456789,
  language = "en"
) {
  const [challenge, setChallenge] = useState<any>(null);
  const [userChallenge, setUserChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const challenges = await loadDailyChallenges(language);
      const todayChallenge = challenges[0] ?? null;

      setChallenge(todayChallenge);

      if (todayChallenge) {
        const progress = await initializeUserChallenge(
          telegramId,
          todayChallenge.id
        );

        setUserChallenge(progress);
      }

      setLoading(false);
    }

    load();
  }, [telegramId, language]);

  async function addProgress(amount = 1) {
    if (!challenge || !userChallenge) return false;

    const newProgress = (userChallenge.progress ?? 0) + amount;

    const completed = await updateDailyChallengeProgress(
      telegramId,
      challenge,
      newProgress
    );

    setUserChallenge({
      ...userChallenge,
      progress: newProgress,
      completed,
    });

    return completed;
  }

  async function claimReward() {
    if (!challenge) return false;

    const success = await claimDailyChallengeReward(
      telegramId,
      challenge
    );

    if (success) {
      setUserChallenge({
        ...userChallenge,
        reward_claimed: true,
      });
    }

    return success;
  }

  return {
    challenge,
    userChallenge,
    loading,
    addProgress,
    claimReward,
  };
}