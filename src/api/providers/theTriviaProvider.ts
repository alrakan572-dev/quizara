import type {
  ContentProvider,
  NormalizedQuestion,
  ProviderFetchParams,
  ProviderResult,
} from "../interfaces/ContentProvider";

import { normalizeTheTriviaQuestion } from "../normalizers/normalizeQuestion";

export const theTriviaProvider: ContentProvider<NormalizedQuestion> = {
  name: "the_trivia_api",
  type: "question",

  async fetchContent(
    params: ProviderFetchParams = {}
  ): Promise<ProviderResult<NormalizedQuestion>> {
    try {
      const amount = params.amount ?? 10;
      const difficulty = params.difficulty ?? "";

      const baseUrl =
        import.meta.env.VITE_THE_TRIVIA_BASE_URL ||
        "https://the-trivia-api.com/api";

      const url = new URL(`${baseUrl}/questions`);

      url.searchParams.set("limit", String(amount));

      if (difficulty) {
        url.searchParams.set("difficulty", difficulty);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`The Trivia API error: ${response.status}`);
      }

      const json = await response.json();

      const items = (json ?? []).map((item: any) =>
        normalizeTheTriviaQuestion(
          item,
          params.language ?? "en"
        )
      );

      return {
        success: true,
        source: "the_trivia_api",
        items,
      };
    } catch (error: any) {
      return {
        success: false,
        source: "the_trivia_api",
        items: [],
        error: error.message ?? "The Trivia API failed",
      };
    }
  },
};