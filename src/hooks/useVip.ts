import { useCallback, useEffect, useState } from "react";
import { GameAPI, GameAPIError } from "../api";
import type { VipPlan, VipStatus } from "../api/types";

export function useVip() {
  const [status, setStatus] = useState<VipStatus | null>(null);
  const [plans, setPlans] = useState<VipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<GameAPIError | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [statusData, plansData] = await Promise.all([
        GameAPI.getVipStatus(),
        GameAPI.getVipPlans({ signal }),
      ]);
      if (signal?.aborted) return;
      setStatus(statusData);
      setPlans(plansData.plans);
    } catch (value) {
      if (signal?.aborted) return;
      setError(value instanceof GameAPIError ? value : new GameAPIError({ message: value instanceof Error ? value.message : "Unable to load VIP data" }));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return { status, plans, loading, error, reload: () => load() };
}
