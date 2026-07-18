import { SessionStorage } from "../auth";

export interface GameAdSettings {
  enabled: boolean;
  every_questions: number;
  provider: "monetag";
  zone_id: number;
  frequency: number;
  capping_hours: number;
  interval_seconds: number;
  timeout_seconds: number;
  every_page: boolean;
}

type ResponseShape =
  | { success: true; data: GameAdSettings }
  | { success: false; error: { code: string; message: string } };

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

export async function getGameAdSettings(signal?: AbortSignal): Promise<GameAdSettings> {
  const token = SessionStorage.getToken();
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !token) {
    throw new Error("Game ad configuration or session is unavailable");
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/get-game-ad-settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: "{}",
    signal,
  });

  const payload = (await response.json().catch(() => null)) as ResponseShape | null;
  if (!payload) throw new Error("Invalid game-ad settings response");
  if (!response.ok || payload.success === false) {
    throw new Error(payload.success === false ? payload.error.message : `Request failed (${response.status})`);
  }

  return payload.data;
}
