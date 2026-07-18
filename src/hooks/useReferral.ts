import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ReferralAPI,
  ReferralAPIError,
  type ClaimReferralResult,
  type ReferralData,
} from "../api/ReferralAPI";

export function useReferral() {
  const [data, setData] =
    useState<ReferralData | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [claiming, setClaiming] =
    useState(false);
  const [error, setError] =
    useState<ReferralAPIError | null>(null);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        setData(
          await ReferralAPI.getReferral(signal),
        );
      } catch (unknownError) {
        if (
          unknownError instanceof DOMException &&
          unknownError.name === "AbortError"
        ) {
          return;
        }

        setError(
          unknownError instanceof ReferralAPIError
            ? unknownError
            : new ReferralAPIError({
                code: "REFERRAL_LOAD_FAILED",
                message:
                  unknownError instanceof Error
                    ? unknownError.message
                    : "Unable to load referral data",
              }),
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const claim = useCallback(
    async (
      referralCode: string,
    ): Promise<ClaimReferralResult> => {
      setClaiming(true);
      setError(null);

      try {
        const result =
          await ReferralAPI.claimReferral(
            referralCode,
          );

        await refresh();
        return result;
      } catch (unknownError) {
        const normalized =
          unknownError instanceof ReferralAPIError
            ? unknownError
            : new ReferralAPIError({
                code: "REFERRAL_CLAIM_FAILED",
                message:
                  unknownError instanceof Error
                    ? unknownError.message
                    : "Unable to claim referral",
              });

        setError(normalized);
        throw normalized;
      } finally {
        setClaiming(false);
      }
    },
    [refresh],
  );

  return {
    data,
    loading,
    claiming,
    error,
    refresh,
    claim,
  };
}
