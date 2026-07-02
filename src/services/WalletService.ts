import { WalletRepository } from "../repositories/WalletRepository";

export type WalletRewardType =
  | "points"
  | "coins"
  | "hints"
  | "extra_spins"
  | "vip_day";

export async function addWalletReward(
  telegramId: number,
  reward: {
    type: WalletRewardType;
    value: number;
  }
) {
  if (reward.type === "points") {
    return await WalletRepository.addPoints(telegramId, reward.value);
  }

  if (reward.type === "coins") {
    return await WalletRepository.addCoins(telegramId, reward.value);
  }

  if (reward.type === "hints") {
    return await WalletRepository.addHints(telegramId, reward.value);
  }

  if (reward.type === "extra_spins") {
    return await WalletRepository.addExtraSpins(telegramId, reward.value);
  }

  if (reward.type === "vip_day") {
    // سيتم تفعيله فعليًا في Sprint 1 VIP
    return { data: null, error: null };
  }

  return { data: null, error: "Invalid reward type" };
}