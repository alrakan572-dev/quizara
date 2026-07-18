export interface BaseQuestion {
  id?: string;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  language: "ar" | "en";
  category: string;
  points: number;
  active: boolean;
}