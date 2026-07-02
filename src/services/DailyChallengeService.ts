import { DailyChallengeRepository } from "../repositories/DailyChallengeRepository";
import { giveReward } from "./RewardService";

/**
 * تحميل التحديات اليومية النشطة
 */
export async function loadDailyChallenges(language = "en") {
  const { data, error } =
    await DailyChallengeRepository.getActiveChallenges(language);

  if (error) {
    console.error("Daily Challenge Error:", error);
    return [];
  }

  return data ?? [];
}

/**
 * إنشاء سجل للمستخدم إذا لم يكن موجوداً
 */
export async function initializeUserChallenge(
  telegramId: number,
  challengeId: number
) {
  const { data } =
    await DailyChallengeRepository.getUserChallenge(
      telegramId,
      challengeId
    );

  if (data) return data;

  const result =
    await DailyChallengeRepository.createUserChallenge(
      telegramId,
      challengeId
    );

  return result.data;
}

/**
 * تحديث تقدم اللاعب
 */
export async function updateDailyChallengeProgress(
  telegramId: number,
  challenge: any,
  progress: number
) {
  const completed =
    progress >= challenge.required_count;

  await DailyChallengeRepository.updateProgress(
    telegramId,
    challenge.id,
    progress,
    completed
  );

  return completed;
}

/**
 * استلام الجائزة
 */
export async function claimDailyChallengeReward(
  telegramId: number,
  challenge: any
) {
  const { data } =
    await DailyChallengeRepository.getUserChallenge(
      telegramId,
      challenge.id
    );

  if (!data) return false;

  if (!data.completed) return false;

  if (data.reward_claimed) return false;

  await giveReward(telegramId, {
    type: "points",
    value: challenge.reward_points,
  });

  await DailyChallengeRepository.claimReward(
    telegramId,
    challenge.id
  );

  return true;
}