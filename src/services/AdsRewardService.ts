import { AdsRewardRepository } from "../repositories/AdsRewardRepository";
import { giveReward } from "./RewardService";
import { getSetting } from "./SettingsService";

export type AdsRewardType =
  | "points"
  | "coins"
  | "hints"
  | "extra_spins";

async function getAdsDailyLimit() {
  const value = await getSetting("ads_daily_limit");
  return Number(value ?? 20);
}

export class AdsRewardService {
  static async canClaimReward(
    telegramId: number
  ) {
    const limit = await getAdsDailyLimit();

    const { count } =
      await AdsRewardRepository.countUserRewardsToday(
        telegramId
      );

    return (count ?? 0) < limit;
  }

  static async claimReward(
    telegramId: number,
    rewardType: AdsRewardType,
    rewardValue: number,
    provider = "telegram"
  ) {
    const canClaim =
      await this.canClaimReward(telegramId);

    if (!canClaim) {
      throw new Error(
        "Daily ads reward limit reached."
      );
    }

    await giveReward(telegramId, {
      type: rewardType,
      value: rewardValue,
    });

    return await AdsRewardRepository.createReward({
      telegram_id: telegramId,
      reward_type: rewardType,
      reward_value: rewardValue,
      ad_provider: provider,
    });
  }

  static async getTodayRewards(
    telegramId: number
  ) {
    return await AdsRewardRepository.getUserRewardsToday(
      telegramId
    );
  }
}