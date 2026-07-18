import { gameClient } from "./GameClient.ts";

export class UsersRepo {
  static async getById(userId: number) {
    const { data, error } = await gameClient()
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateAfterAnswer(params: {
    userId: number;
    points: number;
    isCorrect: boolean;
  }) {
    const user = await this.getById(params.userId);

    const { error } = await gameClient()
      .from("users")
      .update({
        points: Number(user.points ?? 0) + params.points,
        games_played: Number(user.games_played ?? 0) + 1,
        total_correct: Number(user.total_correct ?? 0) + (params.isCorrect ? 1 : 0),
        total_wrong: Number(user.total_wrong ?? 0) + (params.isCorrect ? 0 : 1),
      })
      .eq("id", params.userId);

    if (error) throw error;

    return await this.getById(params.userId);
  }
}