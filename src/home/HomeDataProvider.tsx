import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  HomeAPI,
  HomeAPIError,
  type HomeData,
} from "../api/HomeAPI";
import {
  HOME_REFRESH_EVENT,
  type HomeRefreshDetail,
} from "./homeRefresh";

interface HomeDataContextValue {
  data: HomeData | null;
  loading: boolean;
  refreshing: boolean;
  error: HomeAPIError | null;
  lastUpdatedAt: number | null;
  refresh: () => Promise<void>;
  mutate: (
    updater: (
      current: HomeData,
    ) => HomeData,
  ) => void;
}

const HomeDataContext =
  createContext<HomeDataContextValue | null>(
    null,
  );

interface Props {
  children: ReactNode;
  enabled?: boolean;
  refreshOnFocus?: boolean;
  minimumRefreshIntervalMs?: number;
}

export function HomeDataProvider({
  children,
  enabled = true,
  refreshOnFocus = true,
  minimumRefreshIntervalMs = 2500,
}: Props) {
  const [data, setData] =
    useState<HomeData | null>(null);
  const [loading, setLoading] =
    useState(enabled);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] =
    useState<HomeAPIError | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] =
    useState<number | null>(null);

  const activeRequest =
    useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const lastRequestStartedAtRef =
    useRef(0);

  const load = useCallback(
    async (force = false) => {
      if (!enabled) {
        return;
      }

      const now = Date.now();

      if (
        !force &&
        now -
          lastRequestStartedAtRef.current <
          minimumRefreshIntervalMs
      ) {
        return;
      }

      lastRequestStartedAtRef.current = now;
      requestIdRef.current += 1;
      const requestId =
        requestIdRef.current;

      activeRequest.current?.abort();

      const controller =
        new AbortController();
      activeRequest.current =
        controller;

      if (data) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const next =
          await HomeAPI.getHomeData(
            controller.signal,
          );

        if (
          requestId !==
          requestIdRef.current
        ) {
          return;
        }

        setData(next);
        setLastUpdatedAt(Date.now());
      } catch (unknownError) {
        if (
          unknownError instanceof DOMException &&
          unknownError.name === "AbortError"
        ) {
          return;
        }

        const normalized =
          unknownError instanceof HomeAPIError
            ? unknownError
            : new HomeAPIError({
                code: "HOME_LOAD_FAILED",
                message:
                  unknownError instanceof Error
                    ? unknownError.message
                    : "Unable to load home data",
              });

        if (
          requestId ===
          requestIdRef.current
        ) {
          setError(normalized);
        }
      } finally {
        if (
          requestId ===
          requestIdRef.current
        ) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      data,
      enabled,
      minimumRefreshIntervalMs,
    ],
  );

  const refresh = useCallback(
    async () => {
      await load(true);
    },
    [load],
  );

  const mutate = useCallback(
    (
      updater: (
        current: HomeData,
      ) => HomeData,
    ) => {
      setData((current) =>
        current
          ? updater(current)
          : current,
      );
      setLastUpdatedAt(Date.now());
    },
    [],
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    void load(true);

    return () => {
      activeRequest.current?.abort();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onRefresh = (
      event: Event,
    ) => {
      const detail = (
        event as CustomEvent<HomeRefreshDetail>
      ).detail;

      void load(
        detail?.reason === "manual",
      );
    };

    window.addEventListener(
      HOME_REFRESH_EVENT,
      onRefresh,
    );

    return () => {
      window.removeEventListener(
        HOME_REFRESH_EVENT,
        onRefresh,
      );
    };
  }, [enabled, load]);

  useEffect(() => {
    if (!enabled || !refreshOnFocus) {
      return;
    }

    const onVisible = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void load(false);
      }
    };

    const onFocus = () => {
      void load(false);
    };

    document.addEventListener(
      "visibilitychange",
      onVisible,
    );
    window.addEventListener(
      "focus",
      onFocus,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        onVisible,
      );
      window.removeEventListener(
        "focus",
        onFocus,
      );
    };
  }, [
    enabled,
    load,
    refreshOnFocus,
  ]);

  const value = useMemo(
    () => ({
      data,
      loading,
      refreshing,
      error,
      lastUpdatedAt,
      refresh,
      mutate,
    }),
    [
      data,
      loading,
      refreshing,
      error,
      lastUpdatedAt,
      refresh,
      mutate,
    ],
  );

  return (
    <HomeDataContext.Provider
      value={value}
    >
      {children}
    </HomeDataContext.Provider>
  );
}

export function useHomeData(): HomeDataContextValue {
  const context =
    useContext(HomeDataContext);

  if (!context) {
    throw new Error(
      "useHomeData must be used inside HomeDataProvider",
    );
  }

  return context;
}
