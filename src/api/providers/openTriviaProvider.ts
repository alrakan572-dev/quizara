import type {
  ContentProvider,
  NormalizedQuestion,
  ProviderFetchParams,
  ProviderResult,
} from "../interfaces/ContentProvider";

import { normalizeOpenTriviaQuestion } from "../normalizers/normalizeQuestion";

export const openTriviaProvider: ContentProvider<NormalizedQuestion> = {
  name: "open_trivia",
  type: "question",

  async fetchContent(
    params: ProviderFetchParams = {}
  ): Promise<ProviderResult<NormalizedQuestion>> {
    try {
      const amount = params.amount ?? 10;
      const difficulty = params.difficulty ?? "";

      const baseUrl =
        import.meta.env.VITE_OPEN_TRIVIA_BASE_URL ||
        "https://opentdb.com";

      const url = new URL(`${baseUrl}/api.php`);

      url.searchParams.set("amount", String(amount));
      url.searchParams.set("type", "multiple");

      if (difficulty) {
        url.searchParams.set("difficulty", difficulty);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Open Trivia error: ${response.status}`);
      }

      const json = await response.json();

      const items = (json.results ?? []).map((item: any) =>
        normalizeOpenTriviaQuestion(
          item,
          params.language ?? "en"
        )
      );

      return {
        success: true,
        source: "open_trivia",
        items,
      };
    } catch (error: any) {
      return {
        success: false,
        source: "open_trivia",
        items: [],
        error: error.message ?? "Open Trivia failed",
      };
    }
  },
};