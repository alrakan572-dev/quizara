export type Difficulty = "easy" | "medium" | "hard";

export function randomDifficulty(index?: number): Difficulty {
  const levels: Difficulty[] = ["easy", "medium", "hard"];

  if (typeof index === "number") {
    return levels[index % levels.length];
  }

  return levels[Math.floor(Math.random() * levels.length)];
}

export function difficultyPoints(difficulty: Difficulty): number {
  if (difficulty === "hard") return 50;
  if (difficulty === "medium") return 30;
  return 15;
}