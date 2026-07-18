import { gameClient } from "./GameClient.ts";

export class EconomyRepo {
  static async addCoins(params: {
    userId: number;
    coins: number;
  }) {
    const { data: user, error } = await gameClient()
      .from("users")
      .select("coins")
      .eq("id", params.userId)
      .single();

    if (error) throw error;

    const { error: updateError } = await gameClient()
      .from("users")
      .update({
        coins: Number(user.coins ?? 0) + params.coins,
      })
      .eq("id", params.userId);

    if (updateError) throw updateError;
  }

  static async addHints(params: {
    userId: number;
    hints: number;
  }) {
    const { data: user, error } = await gameClient()
      .from("users")
      .select("hints")
      .eq("id", params.userId)
      .single();

    if (error) throw error;

    const { error: updateError } = await gameClient()
      .from("users")
      .update({
        hints: Number(user.hints ?? 0) + params.hints,
      })
      .eq("id", params.userId);

    if (updateError) throw updateError;
  }
}