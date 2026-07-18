import type {
  ContentProvider,
  NormalizedQuestion,
  ProviderFetchParams,
  ProviderResult,
} from "../interfaces/ContentProvider";

import { quizApiProvider } from "../providers/quizApiProvider";
import { openTriviaProvider } from "../providers/openTriviaProvider";
import { theTriviaProvider } from "../providers/theTriviaProvider";
import { getSetting } from "../../services/SettingsService";

export class ContentProviderManager {
  private static providers: ContentProvider<NormalizedQuestion>[] = [
    quizApiProvider,
    openTriviaProvider,
    theTriviaProvider,
  ];

  private static async getProviderPriority() {
    const priority1 = await getSetting("provider_priority_1");
    const priority2 = await getSetting("provider_priority_2");
    const priority3 = await getSetting("provider_priority_3");

    return [priority1, priority2, priority3].filter(Boolean);
  }

  private static async getOrderedProviders() {
    const priority = await this.getProviderPriority();

    if (priority.length === 0) {
      return this.providers;
    }

    const orderedProviders = priority
      .map((name) =>
        this.providers.find(
          (provider) => provider.name === name
        )
      )
      .filter(Boolean) as ContentProvider<NormalizedQuestion>[];

    const remainingProviders = this.providers.filter(
      (provider) => !priority.includes(provider.name)
    );

    return [
      ...orderedProviders,
      ...remainingProviders,
    ];
  }

  static async fetchQuestions(
    params: ProviderFetchParams = {}
  ): Promise<ProviderResult<NormalizedQuestion>> {
    const providers = await this.getOrderedProviders();

    for (const provider of providers) {
      const result = await provider.fetchContent(params);

      if (result.success && result.items.length > 0) {
        return result;
      }

      console.warn(`${provider.name} failed`, result.error);
    }

    return {
      success: false,
      source: "none",
      items: [],
      error: "No provider available",
    };
  }
}