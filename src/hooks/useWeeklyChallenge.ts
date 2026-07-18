import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import {
  loadWeeklyChallenges,
  initializeWeeklyChallenge,
  updateWeeklyChallengeProgress,
  claimWeeklyChallengeReward,
} from "../services/WeeklyChallengeService";

export function useWeeklyChallenge(language = "en") {
  const { user } = useAuth();
  const telegramId = user?.telegram_id ?? null;
  const [challenge, setChallenge] = useState<any>(null);
  const [userChallenge, setUserChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!telegramId) {
        if (active) {
          setChallenge(null);
          setUserChallenge(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const challenges = await loadWeeklyChallenges(language);
      const activeChallenge = challenges[0] ?? null;

      if (!active) return;
      setChallenge(activeChallenge);

      if (activeChallenge) {
        const progress = await initializeWeeklyChallenge(
          telegramId,
          activeChallenge.id,
        );

        if (!active) return;
        setUserChallenge(progress);
      } else {
        setUserChallenge(null);
      }

      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [telegramId, language]);

  async function addProgress(amount = 1) {
    if (!challenge || !userChallenge) return false;

    const result = await updateWeeklyChallengeProgress(
      userChallenge,
      challenge,
      amount,
    );

    setUserChallenge({
      ...userChallenge,
      progress: result.progress,
      completed: result.completed,
    });

    return result.completed;
  }

  async function claimReward() {
    if (!telegramId || !challenge || !userChallenge) return false;

    const success = await claimWeeklyChallengeReward(
      telegramId,
      userChallenge,
      challenge,
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
