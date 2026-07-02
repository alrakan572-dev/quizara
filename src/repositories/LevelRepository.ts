import { supabase } from "../lib/supabase";

export class LevelRepository {
  static async getAll() {
    return await supabase
      .from("levels")
      .select("*")
      .order("level", { ascending: true });
  }
}