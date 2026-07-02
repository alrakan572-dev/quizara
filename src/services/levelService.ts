import { LevelRepository } from "../repositories/LevelRepository";

export async function calculateUserLevel(points: number) {
  const { data, error } = await LevelRepository.getAll();

  if (error || !data) {
    console.error("Levels Error:", error);
    return 1;
  }

  const currentLevel = data
    .filter((level) => points >= level.required_points)
    .sort((a, b) => b.level - a.level)[0];

  return currentLevel?.level ?? 1;
}