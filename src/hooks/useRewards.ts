import { useCallback, useEffect, useRef, useState } from "react";
import { GameAPI, GameAPIError, type RewardsData } from "../api/GameAPI";

export function useRewards() {
  const [data, setData] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingCode, setClaimingCode] = useState<string | null>(null);
  const [error, setError] = useState<GameAPIError | null>(null);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controller.current?.abort();
    controller.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      setData(await GameAPI.getRewardsData({ signal: controller.current.signal }));
    } catch (unknownError) {
      if (unknownError instanceof DOMException && unknownError.name === "AbortError") return;
      setError(unknownError instanceof GameAPIError ? unknownError : new GameAPIError({ code: "REWARDS_LOAD_FAILED", message: unknownError instanceof Error ? unknownError.message : "Unable to load rewards" }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); return () => controller.current?.abort(); }, [load]);

  const claim = useCallback(async (code: string) => {
    setClaimingCode(code);
    setError(null);
    try {
      const result = await GameAPI.claimAchievementReward(code);
      await load();
      return result;
    } catch (unknownError) {
      const apiError = unknownError instanceof GameAPIError ? unknownError : new GameAPIError({ code: "REWARD_CLAIM_FAILED", message: unknownError instanceof Error ? unknownError.message : "Unable to claim reward" });
      setError(apiError);
      throw apiError;
    } finally {
      setClaimingCode(null);
    }
  }, [load]);

  return { data, loading, error, claimingCode, refresh: load, claim };
}
