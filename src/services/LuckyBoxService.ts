import { LuckyBoxRepository } from "../repositories/LuckyBoxRepository";

export async function loadLuckyBoxRewards() {
  const { data, error } =
    await LuckyBoxRepository.getRewards();

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export function calculateReward(rewards: any[]) {
  const totalProbability = rewards.reduce(
    (sum, reward) => sum + reward.probability,
    0
  );

  let random =
    Math.random() * totalProbability;

  for (const reward of rewards) {
    random -= reward.probability;

    if (random <= 0) {
      return reward;
    }
  }

  return rewards[0];
}

export async function saveLuckyBoxHistory(
  telegramId: number,
  reward: any
) {
  return await LuckyBoxRepository.saveHistory({
    telegram_id: telegramId,
    reward_type: reward.reward_type,
    reward_value: reward.reward_value,
    reward_id: reward.id,
  });
}