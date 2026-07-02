import { supabase } from "../lib/supabase";

export class SettingsRepository {
  static async getAll() {
    return await supabase
      .from("settings")
      .select("*");
  }

  static async getByKey(key: string) {
    return await supabase
      .from("settings")
      .select("*")
      .eq("key", key)
      .single();
  }
}