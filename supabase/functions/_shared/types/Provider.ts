import type { Question } from "./Question.ts";
import type { Riddle } from "./Riddle.ts";
import type { FastestQuestion } from "./FastestQuestion.ts";

export type ProviderContentType = "question" | "riddle" | "fastest";

export type ProviderFetchParams = {
  amount?: number;
  language?: "ar" | "en";
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
};

export type ProviderItem = Question | Riddle | FastestQuestion;

export interface ContentProvider<T extends ProviderItem> {
  name: string;
  type: ProviderContentType;

  fetchContent(params?: ProviderFetchParams): Promise<T[]>;
}