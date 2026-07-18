export const DIFFICULTY_POINTS = {
  easy: 15,
  medium: 25,
  hard: 50,
} as const;

export function getPointsByDifficulty(
  difficulty: string | null | undefined
) {
  const key = String(difficulty ?? "easy").toLowerCase();

  if (key === "hard") return DIFFICULTY_POINTS.hard;
  if (key === "medium") return DIFFICULTY_POINTS.medium;

  return DIFFICULTY_POINTS.easy;
}