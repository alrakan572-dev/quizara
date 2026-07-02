import { UserRepository } from "../repositories/UserRepository";
import { calculateUserLevel } from "./levelService";
import { supabase } from "../lib/supabase";

export async function addUserPoints(
  telegramId: number,
  points: number
) {
  return await supabase.rpc("add_user_points", {
    p_telegram_id: telegramId,
    p_points: points,
  });
}
export async function loginUser(user: {
  telegram_id: number;
  username?: string | null;
  first_name?: string | null;
  photo_url?: string | null;
}) {
  const { data: existingUser } =
    await UserRepository.getByTelegramId(user.telegram_id);

  if (!existingUser) {
    return await UserRepository.create(user);
  }

  await UserRepository.updateLastLogin(user.telegram_id);

  return {
    data: existingUser,
    error: null,
  };
}

export async function updateUserPoints(
  telegramId: number,
  points: number
) {
  return await UserRepository.updatePoints(
    telegramId,
    points
  );
}
export async function updateUserPointsAndLevel(
  telegramId: number,
  points: number
) {
  const level = await calculateUserLevel(points);

  return await UserRepository.updatePointsAndLevel(
    telegramId,
    points,
    level
  );
}
export async function getUserByTelegramId(telegramId: number) {
  return await UserRepository.getByTelegramId(telegramId);
}
export async function updateUserStatsAfterAnswer(
  telegramId: number,
  isCorrect: boolean
) {
  return await UserRepository.updateStatsAfterAnswer(
    telegramId,
    isCorrect
  );
}