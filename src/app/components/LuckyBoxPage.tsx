import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Gift, Play, Sparkles } from "lucide-react";
import {
  GameAPI,
  GameAPIError,
  type LuckyBoxOpenData,
} from "../../api";
import { MonetagService } from "../../ads/MonetagService";

interface Props {
  onBack: () => void;
  userPoints: number;
  onPointsUpdate: (points: number) => void;
}

type Phase = "ready" | "preparing" | "showing" | "verifying" | "opening" | "won";

export function LuckyBoxPage({ onBack, userPoints, onPointsUpdate }: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [reward, setReward] = useState<LuckyBoxOpenData["reward"] | null>(null);
  const [error, setError] = useState<GameAPIError | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    void MonetagService.load().catch(() => undefined);
    return () => { mounted.current = false; };
  }, []);

  const waitForVerification = useCallback(async (attemptId: string) => {
    const started = Date.now();

    while (Date.now() - started < 60000) {
      const status = await GameAPI.getAdAttemptStatus(attemptId);

      if (status.status === "valued") return;
      if (["non_valued", "expired", "consumed"].includes(status.status)) {
        throw new GameAPIError({
          code: "AD_NOT_ELIGIBLE",
          status: 409,
          message:
            status.status === "non_valued"
              ? "This ad was not monetized, so it cannot unlock the Lucky Box."
              : status.status === "expired"
                ? "The ad verification expired. Please watch another ad."
                : "This ad was already used.",
        });
      }

      await new Promise((resolve) => window.setTimeout(resolve, 2000));
    }

    throw new GameAPIError({
      code: "AD_VERIFICATION_TIMEOUT",
      status: 408,
      message: "Ad verification is taking longer than expected. Please try again shortly.",
    });
  }, []);

  const watchAdAndOpen = useCallback(async () => {
    if (phase !== "ready" && phase !== "won") return;

    setReward(null);
    setError(null);
    setPhase("preparing");

    try {
      const attempt = await GameAPI.createLuckyBoxAdAttempt();
      await MonetagService.preloadRewarded(attempt.ymid).catch(() => undefined);
      if (!mounted.current) return;

      setPhase("showing");
      await MonetagService.showRewardedInterstitial(attempt.ymid);
      if (!mounted.current) return;

      setPhase("verifying");
      await waitForVerification(attempt.attempt_id);
      if (!mounted.current) return;

      setPhase("opening");
      const result = await GameAPI.openLuckyBox(attempt.attempt_id);
      if (!mounted.current) return;

      setReward(result.reward);
      onPointsUpdate(Number(result.points_after ?? userPoints));
      setPhase("won");
    } catch (unknownError) {
      if (!mounted.current) return;
      setError(
        unknownError instanceof GameAPIError
          ? unknownError
          : new GameAPIError({
              code: "LUCKY_BOX_CLIENT_ERROR",
              message: unknownError instanceof Error ? unknownError.message : "Unable to open Lucky Box",
            }),
      );
      setPhase("ready");
    }
  }, [onPointsUpdate, phase, userPoints, waitForVerification]);

  const busy = ["preparing", "showing", "verifying", "opening"].includes(phase);

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} disabled={busy} className="rounded-xl p-2" style={{ background: "rgba(251,191,36,.12)", color: "#FBBF24", opacity: busy ? .5 : 1 }}>
          <ArrowLeft size={17} />
        </button>
        <div>
          <h2 style={{ color: "#F9FAFB", fontWeight: 800, margin: 0 }}>Lucky Box</h2>
          <p style={{ color: "#9CA3AF", fontSize: ".75rem", margin: 0 }}>Watch one rewarded ad to unlock one box</p>
        </div>
      </div>

      <motion.div
        animate={busy ? { rotate: [-2, 2, -2], scale: [1, 1.04, 1] } : {}}
        transition={{ repeat: busy ? Infinity : 0, duration: .4 }}
        className="relative flex min-h-[330px] flex-col items-center justify-center overflow-hidden rounded-3xl px-6 text-center"
        style={{ background: "linear-gradient(145deg,#2D1B69,#111827)", border: "1.5px solid rgba(251,191,36,.45)", boxShadow: "0 0 48px rgba(251,191,36,.16)" }}
      >
        <Gift size={74} style={{ color: "#FBBF24", filter: "drop-shadow(0 0 18px rgba(251,191,36,.6))" }} />
        <h3 style={{ color: "#F9FAFB", fontFamily: "'Rajdhani',sans-serif", fontSize: "1.5rem", fontWeight: 800, marginTop: 18 }}>
          {reward ? "YOU WON!" : phaseTitle(phase)}
        </h3>
        {reward ? (
          <div className="mt-3 rounded-2xl px-5 py-3" style={{ background: "rgba(251,191,36,.14)", color: "#FBBF24" }}>
            <Sparkles size={18} style={{ display: "inline", marginRight: 6 }} />
            {reward.type} +{reward.value}
          </div>
        ) : (
          <p style={{ color: "#9CA3AF" }}>Rewards include points, hints, spins, VIP days and jackpots.</p>
        )}
      </motion.div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-center" style={{ background: "rgba(248,113,113,.1)", color: "#FCA5A5" }}>
          {error.message}
        </div>
      )}

      <button type="button" disabled={busy} onClick={() => void watchAdAndOpen()} className="flex w-full items-center justify-center gap-2 rounded-2xl py-4" style={{ background: "linear-gradient(135deg,#D97706,#FBBF24,#6D28D9)", color: "#111827", fontWeight: 900, opacity: busy ? .65 : 1 }}>
        <Play size={18} />
        {buttonTitle(phase)}
      </button>
    </div>
  );
}

function phaseTitle(phase: Phase): string {
  return ({ preparing: "PREPARING AD", showing: "WATCH THE AD", verifying: "VERIFYING AD", opening: "OPENING BOX", won: "YOU WON!", ready: "TRY YOUR LUCK" } as const)[phase];
}

function buttonTitle(phase: Phase): string {
  return ({ preparing: "PREPARING...", showing: "AD IN PROGRESS...", verifying: "VERIFYING...", opening: "OPENING...", won: "WATCH ANOTHER AD", ready: "WATCH AD TO OPEN" } as const)[phase];
}
