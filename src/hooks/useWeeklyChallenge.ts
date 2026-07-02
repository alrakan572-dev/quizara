import { useEffect, useState } from "react";
import {
  loadWeeklyChallenges,
  initializeWeeklyChallenge,
  updateWeeklyChallengeProgress,
  claimWeeklyChallengeReward,
} from "../services/WeeklyChallengeService";

export function useWeeklyChallenge(
  telegramId = 123456789,
  language = "en"
) {
  const [challenge, setChallenge] = useState<any>(null);
  const [userChallenge, setUserChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const challenges = await loadWeeklyChallenges(language);

      const activeChallenge = challenges[0] ?? null;

      setChallenge(activeChallenge);

      if (activeChallenge) {
        const progress = await initializeWeeklyChallenge(
          telegramId,
          activeChallenge.id
        );

        setUserChallenge(progress);
      }

      setLoading(false);
    }

    load();
  }, [telegramId, language]);

  async function addProgress(amount = 1) {
    if (!challenge || !userChallenge) return false;

    const result = await updateWeeklyChallengeProgress(
      userChallenge,
      challenge,
      amount
    );

    setUserChallenge({
      ...userChallenge,
      progress: result.progress,
      completed: result.completed,
    });

    return result.completed;
  }

  async function claimReward() {
    if (!challenge || !userChallenge) return false;

    const success = await claimWeeklyChallengeReward(
      telegramId,
      userChallenge,
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