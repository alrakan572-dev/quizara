import {
  applyReward,
  applyRewards,
  type RewardItem,
} from "../core/RewardEngine";

export async function giveReward(
  telegramId: number,
  reward: RewardItem
) {
  return await applyReward(telegramId, reward);
}

export async function giveRewards(
  telegramId: number,
  rewards: RewardItem[]
) {
  return await applyRewards(telegramId, rewards);
}