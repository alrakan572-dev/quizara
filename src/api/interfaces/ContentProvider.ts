export type ProviderContentType =
  | "question"
  | "riddle"
  | "image";

export type ProviderFetchParams = {
  amount?: number;
  language?: string;
  category?: string;
  difficulty?: string;
};

export type NormalizedQuestion = {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty: string;
  points: number;
  active: boolean;
  category: string;
  source: string;
  api_id: string;
  language: string;
};

export type NormalizedRiddle = {
  question: string;
  correct_answer: string;
  difficulty: string;
  points: number;
  active: boolean;
  source: string;
  api_id: string;
  language: string;
};

export type NormalizedImageChallenge = {
  image_1_url: string;
  image_2_url: string;
  differences_count: number;
  differences_data: any[];
  difficulty: string;
  points: number;
  active: boolean;
  language: string;
  source: string;
  api_id: string;
};

export type ProviderResult<T> = {
  success: boolean;
  source: string;
  items: T[];
  error?: string;
};

export interface ContentProvider<T> {
  name: string;
  type: ProviderContentType;

  fetchContent(
    params?: ProviderFetchParams
  ): Promise<ProviderResult<T>>;
}