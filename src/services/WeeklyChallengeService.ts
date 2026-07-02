import { WeeklyChallengeRepository } from "../repositories/WeeklyChallengeRepository";
import { giveReward } from "./RewardService";

export async function loadWeeklyChallenges(language = "en") {
  const { data, error } = await WeeklyChallengeRepository.getActive(language);

  if (error) {
    console.error("Weekly Challenge Error:", error);
    return [];
  }

  return data ?? [];
}

export async function initializeWeeklyChallenge(
  telegramId: number,
  challengeId: number
) {
  const { data } = await WeeklyChallengeRepository.getUserProgress(
    telegramId,
    challengeId
  );

  if (data) return data;

  const result = await WeeklyChallengeRepository.createUserProgress({
    user_id: telegramId,
    challenge_id: challengeId,
    progress: 0,
    score: 0,
    completed: false,
    reward_claimed: false,
  });

  return result.data;
}

export async function updateWeeklyChallengeProgress(
  userProgress: any,
  challenge: any,
  amount = 1
) {
  const newProgress = (userProgress.progress ?? 0) + amount;
  const completed = newProgress >= challenge.required_count;

  await WeeklyChallengeRepository.updateProgress(
    userProgress.id,
    newProgress,
    completed
  );

  return {
    progress: newProgress,
    completed,
  };
}

export async function claimWeeklyChallengeReward(
  telegramId: number,
  userProgress: any,
  challenge: any
) {
  if (!userProgress) return false;
  if (!userProgress.completed) return false;
  if (userProgress.reward_claimed) return false;

  await giveReward(telegramId, {
    type: "points",
    value: challenge.reward_points,
  });

  await WeeklyChallengeRepository.claimReward(userProgress.id);

  return true;
}