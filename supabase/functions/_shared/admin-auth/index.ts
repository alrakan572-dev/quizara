import { TelegramAuthError, requireTelegramSession } from "../telegram-auth/index.ts";
import { gameClient } from "../game-engine/index.ts";

export type AdminRole = "admin" | "super_admin";

export interface AdminSession {
  userId: number;
  telegramId: number;
  role: AdminRole;
}

export async function requireAdminSession(request: Request): Promise<AdminSession> {
  const session = await requireTelegramSession(request);
  const db = gameClient();
  const { data, error } = await db
    .from("admin_users")
    .select("role,active")
    .eq("user_id", session.userId)
    .maybeSingle();

  if (error) {
    throw new TelegramAuthError(error.message, error.code ?? "ADMIN_LOOKUP_FAILED", 500, error.details);
  }
  if (!data || data.active !== true) {
    throw new TelegramAuthError("Administrator access is required", "ADMIN_ACCESS_DENIED", 403);
  }
  if (data.role !== "admin" && data.role !== "super_admin") {
    throw new TelegramAuthError("Administrator role is invalid", "ADMIN_ROLE_INVALID", 403);
  }

  return { userId: session.userId, telegramId: session.telegramId, role: data.role };
}
