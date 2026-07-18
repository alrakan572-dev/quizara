import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import {
  loadDailyChallenges,
  initializeUserChallenge,
  updateDailyChallengeProgress,
  claimDailyChallengeReward,
} from "../services/DailyChallengeService";

export function useDailyChallenge(language = "en") {
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
      const challenges = await loadDailyChallenges(language);
      const todayChallenge = challenges[0] ?? null;

      if (!active) return;
      setChallenge(todayChallenge);

      if (todayChallenge) {
        const progress = await initializeUserChallenge(
          telegramId,
          todayChallenge.id,
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
    if (!telegramId || !challenge || !userChallenge) return false;

    const newProgress = (userChallenge.progress ?? 0) + amount;
    const completed = await updateDailyChallengeProgress(
      telegramId,
      challenge,
      newProgress,
    );

    setUserChallenge({
      ...userChallenge,
      progress: newProgress,
      completed,
    });

    return completed;
  }

  async function claimReward() {
    if (!telegramId || !challenge) return false;

    const success = await claimDailyChallengeReward(
      telegramId,
      challenge,
    );

    if (success) {
      setUserChallenge((current: any) => ({
        ...current,
        reward_claimed: true,
      }));
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
