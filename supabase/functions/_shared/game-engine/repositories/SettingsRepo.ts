import { gameClient } from "./GameClient.ts";
import type { Difficulty, GameType } from "../core/GameTypes.ts";

export class SettingsRepo {
  private static cache: Record<string, string | null> | null = null;

  static async all() {
    if (this.cache) return this.cache;

    const { data, error } = await gameClient()
      .from("settings")
      .select("key,value");

    if (error) throw error;

    this.cache = {};
    for (const row of data ?? []) {
      this.cache[row.key] = row.value;
    }

    return this.cache;
  }

  static async number(key: string, fallback = 0) {
    const settings = await this.all();
    const value = Number(settings[key]);
    return Number.isFinite(value) ? value : fallback;
  }

  static async points(type: GameType, difficulty: Difficulty) {
    const keys: Record<string, string> = {
      quiz_easy: "easy_points",
      quiz_medium: "medium_points",
      quiz_hard: "hard_points",

      fastest_easy: "easy_points",
      fastest_medium: "medium_points",
      fastest_hard: "hard_points",

      riddle_easy: "riddle_easy_points",
      riddle_medium: "riddle_medium_points",
      riddle_hard: "riddle_hard_points",

      find_difference_easy: "find_difference_easy_points",
      find_difference_medium: "find_difference_medium_points",
      find_difference_hard: "find_difference_hard_points",
    };

    return await this.number(keys[`${type}_${difficulty}`], 0);
  }
}