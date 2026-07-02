import {
  addRewardToWallet,
  addRewardsToWallet,
} from "./WalletEngine";

export type RewardType =
  | "points"
  | "coins"
  | "hints"
  | "extra_spins"
  | "vip_day";

export interface RewardItem {
  type: RewardType;
  value: number;
}

export async function applyReward(
  telegramId: number,
  reward: RewardItem
) {
  return await addRewardToWallet(
    telegramId,
    reward
  );
}

export async function applyRewards(
  telegramId: number,
  rewards: RewardItem[]
) {
  return await addRewardsToWallet(
    telegramId,
    rewards
  );
}