import { VipRepository } from "../repositories/VipRepository";

export class VipService {
  static async getPlans() {
    return await VipRepository.getPlans();
  }

  static async getPlan(planId: number) {
    return await VipRepository.getPlanById(planId);
  }

  static async isVip(telegramId: number) {
    const { data } =
      await VipRepository.getActiveSubscription(
        telegramId
      );

    return !!data;
  }

  static async subscribe(
    telegramId: number,
    planId: number,
    source: string = "manual"
  ) {
    const { data: plan, error } =
      await VipRepository.getPlanById(planId);

    if (error || !plan)
      throw new Error("VIP plan not found.");

    await VipRepository.deactivateUserSubscriptions(
      telegramId
    );

    const start = new Date();

    const expire = new Date(start);

    expire.setDate(
      expire.getDate() + plan.duration_days
    );

    const result =
      await VipRepository.createSubscription({
        telegram_id: telegramId,
        plan_id: plan.id,
        start_date: start.toISOString(),
        expire_date: expire.toISOString(),
        source,
        active: true,
      });

    await VipRepository.updateUserVipStatus(
      telegramId,
      true
    );

    return result;
  }

  static async cancel(telegramId: number) {
    await VipRepository.deactivateUserSubscriptions(
      telegramId
    );

    await VipRepository.updateUserVipStatus(
      telegramId,
      false
    );

    return true;
  }

  static async refreshVipStatus(
    telegramId: number
  ) {
    const active = await this.isVip(telegramId);

    await VipRepository.updateUserVipStatus(
      telegramId,
      active
    );

    return active;
  }
}