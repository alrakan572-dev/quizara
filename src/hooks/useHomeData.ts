import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  GameAPI,
  GameAPIError,
  type AppLanguage,
  type HomeData,
} from "../api";
import {
  HOME_REFRESH_EVENT,
  type HomeRefreshDetail,
} from "../home/homeRefresh";

interface UseHomeDataResult {
  data: HomeData | null;
  loading: boolean;
  refreshing: boolean;
  error: GameAPIError | null;
  refresh: () => Promise<void>;
}

const MINIMUM_REFRESH_INTERVAL_MS = 2500;

export function useHomeData(params: {
  language: AppLanguage;
}): UseHomeDataResult {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<GameAPIError | null>(null);

  const activeRequest = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const lastRequestStartedAt = useRef(0);
  const hasData = useRef(false);

  useEffect(() => {
    hasData.current = data !== null;
  }, [data]);

  const load = useCallback(
    async (force = false) => {
      const now = Date.now();
      if (
        !force &&
        now - lastRequestStartedAt.current < MINIMUM_REFRESH_INTERVAL_MS
      ) {
        return;
      }

      lastRequestStartedAt.current = now;
      requestId.current += 1;
      const currentRequestId = requestId.current;

      activeRequest.current?.abort();
      const controller = new AbortController();
      activeRequest.current = controller;

      if (hasData.current) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const result = await GameAPI.getHomeData(
          { language: params.language },
          { signal: controller.signal },
        );

        if (currentRequestId !== requestId.current) return;
        setData(result);
      } catch (unknownError) {
        if (
          unknownError instanceof DOMException &&
          unknownError.name === "AbortError"
        ) {
          return;
        }

        if (currentRequestId !== requestId.current) return;

        setError(
          unknownError instanceof GameAPIError
            ? unknownError
            : new GameAPIError({
                code: "UNKNOWN_HOME_ERROR",
                message:
                  unknownError instanceof Error
                    ? unknownError.message
                    : "Unable to load home data",
              }),
        );
      } finally {
        if (currentRequestId === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [params.language],
  );

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  useEffect(() => {
    void load(true);
    return () => activeRequest.current?.abort();
  }, [load]);

  useEffect(() => {
    const onRefresh = (event: Event) => {
      const detail = (event as CustomEvent<HomeRefreshDetail>).detail;
      void load(detail?.reason === "manual");
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void load(false);
    };

    const onFocus = () => void load(false);

    window.addEventListener(HOME_REFRESH_EVENT, onRefresh);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener(HOME_REFRESH_EVENT, onRefresh);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  return { data, loading, refreshing, error, refresh };
}
