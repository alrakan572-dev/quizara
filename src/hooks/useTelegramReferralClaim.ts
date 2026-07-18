import {
  useEffect,
  useRef,
} from "react";

import { ReferralAPI } from "../api/ReferralAPI";

interface TelegramWebApp {
  initDataUnsafe?: {
    start_param?: string;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function useTelegramReferralClaim(
  onPointsUpdate?: (points: number) => void,
): void {
  const processedRef =
    useRef(false);

  useEffect(() => {
    if (processedRef.current) {
      return;
    }

    const startParam =
      window.Telegram?.WebApp
        ?.initDataUnsafe
        ?.start_param;

    const code =
      typeof startParam === "string"
        ? startParam.trim().toUpperCase()
        : "";

    if (
      !/^QZ[A-Z0-9]{4,10}$/.test(code)
    ) {
      return;
    }

    processedRef.current = true;

    void ReferralAPI.claimReferral(code)
      .then((result) => {
        if (
          result.invited_points_after !== undefined &&
          onPointsUpdate
        ) {
          onPointsUpdate(
            Number(
              result.invited_points_after,
            ),
          );
        }
      })
      .catch(() => {
        // Claim errors do not block application startup.
      });
  }, [onPointsUpdate]);
}
