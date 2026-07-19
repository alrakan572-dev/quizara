/**
 * Compatibility facade for the former home-dashboard API layer.
 *
 * The production application uses GameAPI as the single implementation for
 * Edge Function requests and src/api/types.ts as the canonical response
 * contract. Keeping this facade prevents existing imports from breaking while
 * ensuring there is only one get-home-data request implementation and one
 * HomeData type in the project.
 */
import {
  GameAPI,
  GameAPIError,
} from "./GameAPI";
import type {
  AppLanguage,
  HomeData,
  HomeUser,
  HomeChallenge,
  LeaderboardEntry,
  LuckyBoxStatus,
  VipStatus,
} from "./types";

export type {
  AppLanguage,
  HomeData,
  HomeUser,
  HomeChallenge,
  LeaderboardEntry,
  LuckyBoxStatus,
  VipStatus,
};

export { GameAPIError as HomeAPIError };

export const HomeAPI = {
  getHomeData(
    signal?: AbortSignal,
    language: AppLanguage = "en",
  ): Promise<HomeData> {
    return GameAPI.getHomeData(
      { language },
      { signal },
    );
  },
};
