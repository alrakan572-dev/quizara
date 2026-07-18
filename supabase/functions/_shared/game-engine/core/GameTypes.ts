export type GameType =
  | "quiz"
  | "riddle"
  | "fastest"
  | "find_difference";

export type Difficulty =
  | "easy"
  | "medium"
  | "hard";

export type Language =
  | "ar"
  | "en";

export type GetNextGameInput = {
  user_id: number;
  type: GameType;
  language?: Language;
  category?: string;
  difficulty?: Difficulty;
};

export type SubmitAnswerInput = {
  user_id: number;
  type: GameType;
  item_id: number;
  answer?: string;
  found_count?: number;
  answer_time_ms?: number;
};

export type GameEngineSuccess<T = unknown> = {
  success: true;
  data: T;
};

export type GameEngineFailure = {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
    hint?: string;
  };
};

export type GameEngineResult<T = unknown> =
  | GameEngineSuccess<T>
  | GameEngineFailure;