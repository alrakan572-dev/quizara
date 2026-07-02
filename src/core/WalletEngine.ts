import { addWalletReward } from "../services/WalletService";
import type { RewardItem } from "./RewardEngine";

export async function addRewardToWallet(
  telegramId: number,
  reward: RewardItem
) {
  return await addWalletReward(telegramId, reward);
}

export async function addRewardsToWallet(
  telegramId: number,
  rewards: RewardItem[]
) {
  const results = [];

  for (const reward of rewards) {
    const result = await addRewardToWallet(
      telegramId,
      reward
    );

    results.push(result);
  }

  return results;
}