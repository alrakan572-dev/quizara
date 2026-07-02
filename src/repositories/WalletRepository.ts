import { supabase } from "../lib/supabase";

export class WalletRepository {
  static async addPoints(telegramId: number, points: number) {
    return await supabase.rpc("add_user_points", {
      p_telegram_id: telegramId,
      p_points: points,
    });
  }

  static async addCoins(telegramId: number, coins: number) {
    const { data: user, error } = await supabase
      .from("users")
      .select("coins")
      .eq("telegram_id", telegramId)
      .single();

    if (error) return { data: null, error };

    return await supabase
      .from("users")
      .update({
        coins: (user.coins ?? 0) + coins,
      })
      .eq("telegram_id", telegramId);
  }

  static async addHints(telegramId: number, hints: number) {
    const { data: user, error } = await supabase
      .from("users")
      .select("hints")
      .eq("telegram_id", telegramId)
      .single();

    if (error) return { data: null, error };

    return await supabase
      .from("users")
      .update({
        hints: (user.hints ?? 0) + hints,
      })
      .eq("telegram_id", telegramId);
  }

  static async addExtraSpins(telegramId: number, extraSpins: number) {
    const { data: user, error } = await supabase
      .from("users")
      .select("extra_spins")
      .eq("telegram_id", telegramId)
      .single();

    if (error) return { data: null, error };

    return await supabase
      .from("users")
      .update({
        extra_spins: (user.extra_spins ?? 0) + extraSpins,
      })
      .eq("telegram_id", telegramId);
  }
}