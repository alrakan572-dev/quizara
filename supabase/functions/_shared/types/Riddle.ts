import type { BaseQuestion } from "./BaseQuestion.ts";

export interface Riddle extends BaseQuestion {
  answer: string;
  hint?: string;
}