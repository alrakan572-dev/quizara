import { VipService } from "../services/VipService";
import { emitGameEvent } from "./EventEngine";

export class VipEngine {
  static async buyPlan(
    telegramId: number,
    planId: number,
    source: string = "manual"
  ) {
    const result = await VipService.subscribe(
      telegramId,
      planId,
      source
    );

    await emitGameEvent({
      type: "vip_activated",
      telegramId,
    });

    return result;
  }

  static async cancelVip(
    telegramId: number
  ) {
    await VipService.cancel(telegramId);

    await emitGameEvent({
      type: "vip_cancelled",
      telegramId,
    });

    return true;
  }

  static async isVip(
    telegramId: number
  ) {
    return await VipService.isVip(telegramId);
  }

  static async getPlans() {
    return await VipService.getPlans();
  }

  static async refresh(
    telegramId: number
  ) {
    return await VipService.refreshVipStatus(
      telegramId
    );
  }
}