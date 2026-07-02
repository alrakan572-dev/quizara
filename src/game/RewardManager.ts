import { updateUserPoints } from "../services/userService";

export async function rewardUser(
  telegramId: number,
  currentPoints: number,
  earnedPoints: number
) {
  const newTotal = currentPoints + earnedPoints;

  await updateUserPoints(telegramId, newTotal);

  return newTotal;
}