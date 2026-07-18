import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2, Gift, RefreshCw } from "lucide-react";
import { GameAPI, GameAPIError, type AppLanguage, type HomeChallenge } from "../../api";

interface ChallengesPageProps {
  scope: "daily" | "weekly";
  onBack: () => void;
  userPoints: number;
  onPointsUpdate: (points: number) => void;
  language?: AppLanguage;
}

export function ChallengesPage({
  scope,
  onBack,
  userPoints,
  onPointsUpdate,
  language = "en",
}: ChallengesPageProps) {
  const [items, setItems] = useState<HomeChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [error, setError] = useState<GameAPIError | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const data = await GameAPI.getActiveChallenges({ language });
      setItems(scope === "daily" ? data.daily : data.weekly);
    } catch (unknownError) {
      setError(toGameAPIError(unknownError, "Unable to load challenges"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  const claim = useCallback(async (item: HomeChallenge) => {
    if (!item.can_claim || item.reward_claimed || claiming !== null) return;

    setClaiming(item.id);
    setError(null);

    try {
      const result = await GameAPI.claimChallengeReward({
        challengeId: item.id,
        scope,
      });

      const pointsAfter = readAuthoritativePoints(result);
      if (pointsAfter !== null) onPointsUpdate(pointsAfter);

      await load(true);
    } catch (unknownError) {
      setError(toGameAPIError(unknownError, "Unable to claim challenge reward"));
    } finally {
      setClaiming(null);
    }
  }, [claiming, load, onPointsUpdate, scope]);

  const pageTitle = scope === "daily" ? "Daily Challenges" : "Weekly Challenge";

  return (
    <div className="flex flex-col gap-4 pb-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            className="rounded-xl px-3 py-2"
            style={{
              background: "rgba(109,40,217,.15)",
              border: "1px solid rgba(109,40,217,.28)",
              color: "#A78BFA",
            }}
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </motion.button>

          <div>
            <h2 style={{ color: "#F9FAFB", fontWeight: 800, margin: 0 }}>
              {pageTitle}
            </h2>
            <p style={{ color: "#9CA3AF", fontSize: ".75rem", margin: 0 }}>
              Complete goals and claim points
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => void load(true)}
          disabled={loading || refreshing || claiming !== null}
          className="rounded-xl p-2.5"
          style={{
            background: "rgba(34,211,238,.08)",
            border: "1px solid rgba(34,211,238,.22)",
            color: "#67E8F9",
            opacity: loading || refreshing || claiming !== null ? 0.55 : 1,
          }}
          aria-label="Refresh challenges"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : undefined} />
        </motion.button>
      </div>

      <div
        className="rounded-xl px-3 py-2"
        style={{
          background: "rgba(251,191,36,.08)",
          border: "1px solid rgba(251,191,36,.18)",
          color: "#FBBF24",
          fontFamily: "'Rajdhani',sans-serif",
          fontWeight: 700,
          fontSize: ".78rem",
        }}
      >
        Current points: {userPoints.toLocaleString()}
      </div>

      {loading && <State text="Loading challenges..." />}

      {error && (
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: "rgba(248,113,113,.1)",
            border: "1px solid rgba(248,113,113,.25)",
            color: "#FCA5A5",
          }}
        >
          {error.message}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <State text="No active challenges are available." />
      )}

      {!loading && items.map((item, index) => {
        const progressPercent = clampPercent(item.progress_percent);

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.35) }}
            className="rounded-2xl px-4 py-4"
            style={{
              background: "linear-gradient(145deg,#1F2937,#111827)",
              border: "1px solid rgba(109,40,217,.25)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 style={{ color: "#F9FAFB", fontWeight: 700, margin: 0 }}>
                  {item.title ?? "Challenge"}
                </h3>
                <p style={{ color: "#9CA3AF", fontSize: ".76rem", margin: "4px 0 0 0" }}>
                  {item.description ?? item.challenge_type ?? ""}
                </p>
              </div>

              <div
                className="flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1"
                style={{
                  background: "rgba(251,191,36,.12)",
                  border: "1px solid rgba(251,191,36,.2)",
                  color: "#FBBF24",
                }}
              >
                <Gift size={12} />
                +{item.reward_points}
              </div>
            </div>

            <div
              className="mt-3 h-2 overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,.07)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg,#6D28D9,#22D3EE)" }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <span style={{ color: "#9CA3AF", fontSize: ".72rem" }}>
                {item.progress}/{item.required_count} · {progressPercent}%
              </span>

              {item.reward_claimed ? (
                <span
                  className="flex items-center gap-1"
                  style={{ color: "#34D399", fontSize: ".78rem", fontWeight: 700 }}
                >
                  <CheckCircle2 size={14} />
                  Claimed
                </span>
              ) : (
                <motion.button
                  type="button"
                  whileTap={item.can_claim ? { scale: 0.95 } : undefined}
                  disabled={!item.can_claim || claiming !== null}
                  onClick={() => void claim(item)}
                  className="rounded-xl px-3 py-2"
                  style={{
                    background: item.can_claim ? "#6D28D9" : "#374151",
                    color: "white",
                    opacity: item.can_claim ? 1 : 0.55,
                    cursor: item.can_claim ? "pointer" : "not-allowed",
                  }}
                >
                  {claiming === item.id
                    ? "Claiming..."
                    : item.completed
                      ? "CLAIM"
                      : "IN PROGRESS"}
                </motion.button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function readAuthoritativePoints(result: Record<string, unknown>): number | null {
  const candidates: unknown[] = [
    result.points_after,
    result.total_points,
    result.points,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isSafeInteger(value) && value >= 0) return value;
  }

  const user =
    result.user && typeof result.user === "object"
      ? (result.user as Record<string, unknown>)
      : null;

  const userPoints = Number(user?.points);
  return Number.isSafeInteger(userPoints) && userPoints >= 0
    ? userPoints
    : null;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(Math.trunc(Number(value) || 0), 100));
}

function toGameAPIError(
  unknownError: unknown,
  fallbackMessage: string,
): GameAPIError {
  if (unknownError instanceof GameAPIError) return unknownError;

  return new GameAPIError({
    code: "CHALLENGES_ERROR",
    message:
      unknownError instanceof Error
        ? unknownError.message
        : fallbackMessage,
  });
}

function State({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl px-5 py-8 text-center"
      style={{
        background: "#1F2937",
        border: "1px solid rgba(109,40,217,.15)",
        color: "#9CA3AF",
      }}
    >
      {text}
    </div>
  );
}
