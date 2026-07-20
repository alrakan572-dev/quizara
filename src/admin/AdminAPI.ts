import { SessionStorage } from "../auth";

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

export interface AdminDashboardData {
  admin: { user_id: number; role: "admin" | "super_admin" };
  metrics: {
    users: number;
    new_users_today: number;
    blocked_users: number;
    questions: number;
    riddles: number;
    find_difference: number;
    active_vip: number;
  };
  settings: Record<string, string | null>;
  recent_users: Array<{
    id: number;
    telegram_id: number;
    username: string | null;
    first_name: string | null;
    points: number;
    level: number | null;
    vip: boolean;
    is_blocked: boolean;
    created_at: string;
  }>;
  generated_at: string;
}

export class AdminAPIError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdminAPIError";
  }
}

async function invoke<T>(functionName: string, body: Record<string, unknown>): Promise<T> {
  const token = SessionStorage.getToken();
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new AdminAPIError("Supabase frontend configuration is missing", "MISSING_CONFIGURATION", 500);
  if (!token) throw new AdminAPIError("A valid Quizara session is required", "SESSION_REQUIRED", 401);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null) as { success?: boolean; data?: T; error?: { code?: string; message?: string } } | null;
  if (!payload) throw new AdminAPIError("Invalid server response", "INVALID_API_RESPONSE", response.status);
  if (!response.ok || payload.success !== true || payload.data === undefined) {
    throw new AdminAPIError(payload.error?.message ?? "Admin request failed", payload.error?.code ?? "ADMIN_REQUEST_FAILED", response.status);
  }
  return payload.data;
}

export const AdminAPI = {
  dashboard: () => invoke<AdminDashboardData>("admin-dashboard", {}),
  updateSettings: (settings: Record<string, string | boolean | number>) =>
    invoke<{ settings: Record<string, string>; updated_at: string }>("admin-update-settings", { settings }),
};
