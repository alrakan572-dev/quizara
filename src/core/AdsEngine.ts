import { AdsRewardService } from "../services/AdsRewardService";
import { emitGameEvent } from "./EventEngine";

export type AdsRewardType =
  | "points"
  | "coins"
  | "hints"
  | "extra_spins";

export class AdsEngine {
  static async canWatchAd(telegramId: number) {
    return await AdsRewardService.canClaimReward(telegramId);
  }

  static async rewardAfterAd(
    telegramId: number,
    rewardType: AdsRewardType = "points",
    rewardValue: number = 10,
    provider: string = "telegram"
  ) {
    const result = await AdsRewardService.claimReward(
      telegramId,
      rewardType,
      rewardValue,
      provider
    );

    await emitGameEvent({
      type: "ad_reward_claimed",
      telegramId,
      points: rewardType === "points" ? rewardValue : 0,
    });

    return result;
  }

  static async getTodayRewards(telegramId: number) {
    return await AdsRewardService.getTodayRewards(telegramId);
  }
}