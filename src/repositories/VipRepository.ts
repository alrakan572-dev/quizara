import { supabase } from "../lib/supabase";

export const VipRepository = {
  async getPlans() {
    return await supabase
      .from("vip_plans")
      .select("*")
      .eq("active", true)
      .order("duration_days", { ascending: true });
  },

  async getPlanById(planId: number) {
    return await supabase
      .from("vip_plans")
      .select("*")
      .eq("id", planId)
      .single();
  },

  async getActiveSubscription(telegramId: number) {
    return await supabase
      .from("vip_subscriptions")
      .select("*, vip_plans(*)")
      .eq("telegram_id", telegramId)
      .eq("active", true)
      .gt("expire_date", new Date().toISOString())
      .order("expire_date", { ascending: false })
      .limit(1)
      .maybeSingle();
  },

  async createSubscription(data: {
    telegram_id: number;
    plan_id: number;
    start_date: string;
    expire_date: string;
    source: string;
    active: boolean;
  }) {
    return await supabase
      .from("vip_subscriptions")
      .insert(data)
      .select()
      .single();
  },

  async deactivateUserSubscriptions(telegramId: number) {
    return await supabase
      .from("vip_subscriptions")
      .update({
        active: false,
      })
      .eq("telegram_id", telegramId)
      .eq("active", true);
  },

  async updateUserVipStatus(
    telegramId: number,
    vip: boolean
  ) {
    return await supabase
      .from("users")
      .update({
        vip,
      })
      .eq("telegram_id", telegramId);
  },
};