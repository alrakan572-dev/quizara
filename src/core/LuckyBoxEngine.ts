export type LuckyBoxRewardType =
  | "POINTS"
  | "points"
  | "coins"
  | "hint"
  | "hints"
  | "extra_spin"
  | "extra_spins"
  | "VIP_day"
  | "vip_day"
  | "jackpot";

export type LuckyBoxReward = {
  id: number;
  reward_type: LuckyBoxRewardType | string;
  reward_value: number;
  probability: number;
  active: boolean;
};

export function spinLuckyBox(rewards: LuckyBoxReward[]) {
  if (!rewards.length) return null;

  const totalProbability = rewards.reduce(
    (sum, reward) => sum + Number(reward.probability || 0),
    0
  );

  let random = Math.random() * totalProbability;

  for (const reward of rewards) {
    random -= Number(reward.probability || 0);

    if (random <= 0) {
      return reward;
    }
  }

  return rewards[0];
}

export function normalizeRewardType(type: string) {
  const value = type.toLowerCase();

  if (value === "points") return "points";
  if (value === "coins") return "coins";
  if (value === "hint" || value === "hints") return "hints";
  if (value === "extra_spin" || value === "extra_spins") return "extra_spins";
  if (value === "vip_day") return "vip_day";
  if (value === "jackpot") return "points";

  return "points";
}

export function convertLuckyBoxRewardToWalletReward(reward: LuckyBoxReward) {
  return {
    type: normalizeRewardType(reward.reward_type) as
      | "points"
      | "coins"
      | "hints"
      | "extra_spins",
    value: reward.reward_value,
  };
}

export function isJackpot(reward: LuckyBoxReward) {
  return reward.reward_type.toLowerCase() === "jackpot";
}