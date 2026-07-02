import { supabase } from "../lib/supabase";

export async function testConnection() {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .limit(1);

  console.log("Supabase Data:", data);
  console.log("Supabase Error:", error);
}