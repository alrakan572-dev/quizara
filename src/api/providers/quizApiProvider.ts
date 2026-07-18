import type {
  ContentProvider,
  NormalizedQuestion,
  ProviderFetchParams,
  ProviderResult,
} from "../interfaces/ContentProvider";

import { normalizeQuizApiQuestion } from "../normalizers/normalizeQuestion";

export const quizApiProvider: ContentProvider<NormalizedQuestion> = {
  name: "quizapi",
  type: "question",

  async fetchContent(
    params: ProviderFetchParams = {}
  ): Promise<ProviderResult<NormalizedQuestion>> {
    try {
      const apiKey = import.meta.env.VITE_QUIZ_API_KEY;
      const baseUrl =
        import.meta.env.VITE_QUIZ_API_BASE_URL ||
        "https://quizapi.io/api/v1";

      const limit = params.amount ?? 10;
      const difficulty = params.difficulty ?? "";

      const url = new URL(`${baseUrl}/questions`);

      url.searchParams.set("limit", String(limit));

      if (difficulty) {
        url.searchParams.set("difficulty", difficulty);
      }

      const response = await fetch(url.toString(), {
        headers: {
          "X-Api-Key": apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`QuizAPI error: ${response.status}`);
      }

      const json = await response.json();

      const items = (json ?? []).map((item: any) =>
        normalizeQuizApiQuestion(item, params.language ?? "en")
      );

      return {
        success: true,
        source: "quizapi",
        items,
      };
    } catch (error: any) {
      return {
        success: false,
        source: "quizapi",
        items: [],
        error: error.message ?? "QuizAPI failed",
      };
    }
  },
};