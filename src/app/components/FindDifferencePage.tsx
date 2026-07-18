import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lightbulb,
} from "lucide-react";
import confetti from "canvas-confetti";

import {
  GameAPI,
  GameAPIError,
  type AppLanguage,
  type GameItem,
  type SubmitAnswerData,
} from "../../api";

interface FindDifferencePageProps {
  onBack: () => void;
  onPointsUpdate: (points: number) => void;
  language?: AppLanguage;
}

interface DifferencePoint {
  id: number;
  x: number;
  y: number;
  radius: number;
  label?: string;
}

type Phase =
  | "loading"
  | "playing"
  | "submitting"
  | "success"
  | "fail"
  | "empty"
  | "error";

const DEFAULT_TIME_SECONDS = 60;
const DEFAULT_HINTS = 3;

export function FindDifferencePage({
  onBack,
  onPointsUpdate,
  language = "en",
}: FindDifferencePageProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [item, setItem] = useState<GameItem | null>(null);
  const [gameToken, setGameToken] = useState<string | null>(null);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [hinted, setHinted] = useState<Set<number>>(new Set());
  const [hintsLeft, setHintsLeft] = useState(DEFAULT_HINTS);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME_SECONDS);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [foundBurst, setFoundBurst] = useState<number | null>(null);
  const [result, setResult] = useState<SubmitAnswerData | null>(null);
  const [error, setError] = useState<GameAPIError | null>(null);

  const startedAtRef = useRef(Date.now());
  const submittingRef = useRef(false);

  const differences = useMemo(
    () => parseDifferences(item?.differences_data),
    [item?.differences_data],
  );

  const requiredCount = Math.max(
    Number(item?.differences_count ?? differences.length ?? 0),
    differences.length,
  );

  const timeLimit =
    Number(item?.time_limit) > 0
      ? Number(item?.time_limit)
      : DEFAULT_TIME_SECONDS;

  const loadLevel = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setFound(new Set());
    setHinted(new Set());
    setHintsLeft(DEFAULT_HINTS);
    setResult(null);
    submittingRef.current = false;

    try {
      const data = await GameAPI.getNextGame({
        type: "find_difference",
        language,
      });

      if (data.empty || data.completed || !data.item || !data.game_token) {
        setItem(null);
        setGameToken(null);
        setPhase("empty");
        return;
      }

      setItem(data.item);
      setGameToken(data.game_token);

      const nextTime =
        Number(data.item.time_limit) > 0
          ? Number(data.item.time_limit)
          : DEFAULT_TIME_SECONDS;

      setTimeLeft(nextTime);
      startedAtRef.current = Date.now();
      setPhase("playing");
    } catch (unknownError) {
      setError(normalizeError(unknownError));
      setPhase("error");
    }
  }, [language]);

  useEffect(() => {
    void loadLevel();
  }, [loadLevel]);

  const submitResult = useCallback(
    async (foundCount: number, timedOut: boolean) => {
      if (
        submittingRef.current ||
        !item ||
        !gameToken
      ) {
        return;
      }

      submittingRef.current = true;
      setPhase("submitting");

      try {
        const response = await GameAPI.submitAnswer({
            type: "find_difference",
          itemId: Number(item.id),
          gameToken,
          foundCount,
          answer: timedOut ? "__TIMEOUT__" : "completed",
          answerTimeMs: Date.now() - startedAtRef.current,
        });

        setResult(response);

        if (response.user?.points != null) {
          onPointsUpdate(Number(response.user.points));
        }

        if (response.is_correct) {
          setPhase("success");

          confetti({
            particleCount: 110,
            spread: 95,
            origin: { x: 0.5, y: 0.42 },
            colors: [
              "#6D28D9",
              "#22D3EE",
              "#FBBF24",
              "#A78BFA",
              "#34D399",
            ],
          });
        } else {
          setPhase("fail");
        }
      } catch (unknownError) {
        setError(normalizeError(unknownError));
        setPhase("error");
      } finally {
        submittingRef.current = false;
      }
    },
    [gameToken, item, onPointsUpdate],
  );

  useEffect(() => {
    if (phase !== "playing") return;

    if (timeLeft <= 0) {
      void submitResult(found.size, true);
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [found.size, phase, submitResult, timeLeft]);

  const handleImageClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (phase !== "playing") return;

    if (differences.length === 0) {
      setWrongFlash(true);
      window.setTimeout(() => setWrongFlash(false), 350);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const xPercent =
      ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent =
      ((event.clientY - rect.top) / rect.height) * 100;

    const matched = differences.find((difference) => {
      if (found.has(difference.id)) return false;

      const distance = Math.hypot(
        xPercent - difference.x,
        yPercent - difference.y,
      );

      return distance <= difference.radius;
    });

    if (!matched) {
      setWrongFlash(true);
      window.setTimeout(() => setWrongFlash(false), 350);
      return;
    }

    const next = new Set(found);
    next.add(matched.id);
    setFound(next);
    setFoundBurst(matched.id);

    window.setTimeout(() => setFoundBurst(null), 850);

    if (next.size >= requiredCount) {
      void submitResult(next.size, false);
    }
  };

  const handleHint = () => {
    if (
      phase !== "playing" ||
      hintsLeft <= 0
    ) {
      return;
    }

    const available = differences.filter(
      (difference) =>
        !found.has(difference.id) &&
        !hinted.has(difference.id),
    );

    if (available.length === 0) return;

    const selected =
      available[Math.floor(Math.random() * available.length)];

    setHinted((previous) => new Set([...previous, selected.id]));
    setHintsLeft((previous) => previous - 1);
  };

  if (phase === "loading") {
    return (
      <StatusCard
        emoji="🔎"
        title="Loading Find the Difference..."
        message="Preparing the next image challenge."
      />
    );
  }

  if (phase === "empty") {
    return (
      <StatusCard
        emoji="📭"
        title="No image levels available"
        message="There are no active Find the Difference levels for this language."
        actionLabel="BACK TO HOME"
        onAction={onBack}
      />
    );
  }

  if (phase === "error") {
    return (
      <StatusCard
        emoji="⚠️"
        title="Unable to load the level"
        message={error?.message ?? "Unknown error"}
        actionLabel="TRY AGAIN"
        onAction={() => void loadLevel()}
        onBack={onBack}
      />
    );
  }

  if (phase === "success") {
    return (
      <ResultScreen
        success
        foundCount={found.size}
        total={requiredCount}
        points={Number(result?.points_earned ?? 0)}
        timeLeft={timeLeft}
        onRestart={() => void loadLevel()}
        onBack={onBack}
      />
    );
  }

  if (phase === "fail") {
    return (
      <ResultScreen
        success={false}
        foundCount={found.size}
        total={requiredCount}
        points={0}
        timeLeft={0}
        onRestart={() => void loadLevel()}
        onBack={onBack}
      />
    );
  }

  if (!item) return null;

  const originalImage =
    String(item.image_1_url ?? "");
  const modifiedImage =
    String(item.image_2_url ?? "");

  const timerColor =
    timeLeft > timeLimit * 0.5
      ? "#22D3EE"
      : timeLeft > timeLimit * 0.25
        ? "#FBBF24"
        : "#F87171";

  return (
    <div className="relative flex flex-col gap-3 pb-2">
      <div className="flex items-center justify-between">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2"
          style={{
            background: "rgba(34,211,238,0.1)",
            border: "1px solid rgba(34,211,238,0.3)",
            color: "#67E8F9",
          }}
        >
          <ArrowLeft size={15} />
          Back
        </motion.button>

        <div className="flex items-center gap-1.5">
          <span>🔎</span>
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              color: "#F0F4FF",
            }}
          >
            FIND THE DIFFERENCE
          </span>
        </div>

        <span
          className="rounded-full px-2.5 py-1"
          style={{
            color: "#FBBF24",
            background: "rgba(251,191,36,0.12)",
            border: "1px solid rgba(251,191,36,0.35)",
            fontSize: "0.65rem",
            fontWeight: 700,
          }}
        >
          {String(item.difficulty ?? "MEDIUM").toUpperCase()}
        </span>
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          background:
            "linear-gradient(135deg, rgba(10,15,30,0.9), rgba(26,16,64,0.8))",
          border: `1.5px solid ${timerColor}55`,
        }}
      >
        <Clock size={18} style={{ color: timerColor }} />

        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between">
            <span style={{ color: "#9CA3AF", fontSize: "0.7rem" }}>
              Found {found.size} / {requiredCount}
            </span>
            <span style={{ color: "#FBBF24", fontSize: "0.7rem" }}>
              +{Number(item.points ?? 0)} pts
            </span>
          </div>

          <div className="flex gap-1.5">
            {Array.from({ length: requiredCount }).map((_, index) => (
              <div
                key={index}
                className="h-2 flex-1 rounded-full"
                style={{
                  background:
                    index < found.size
                      ? "#34D399"
                      : "rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>
        </div>

        <span
          style={{
            color: timerColor,
            fontWeight: 800,
            fontSize: "1.15rem",
          }}
        >
          {timeLeft}s
        </span>
      </div>

      <ImageLabel label="ORIGINAL" color="#22D3EE" />

      <ImagePanel
        url={originalImage}
        alt="Original"
        borderColor="rgba(34,211,238,0.3)"
      />

      <ImageLabel
        label="FIND THE DIFFERENCES — TAP HERE"
        color="#A78BFA"
      />

      <motion.div
        onClick={handleImageClick}
        className="relative w-full cursor-crosshair overflow-hidden rounded-2xl"
        style={{
          border: `1.5px solid ${
            wrongFlash
              ? "#F87171"
              : "rgba(167,139,250,0.3)"
          }`,
          boxShadow: wrongFlash
            ? "0 0 28px rgba(248,113,113,0.4)"
            : "0 0 24px rgba(167,139,250,0.12)",
        }}
      >
        <ImageContent
          url={modifiedImage}
          alt="Modified"
        />

        {differences.map((difference) => {
          const isFound = found.has(difference.id);
          const isHinted = hinted.has(difference.id);

          if (!isFound && !isHinted) return null;

          return (
            <motion.div
              key={difference.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute flex items-center justify-center rounded-full"
              style={{
                left: `${difference.x}%`,
                top: `${difference.y}%`,
                width: `${difference.radius * 2}%`,
                aspectRatio: "1 / 1",
                transform: "translate(-50%, -50%)",
                border: `2px solid ${
                  isFound ? "#34D399" : "#FBBF24"
                }`,
                background: isFound
                  ? "rgba(52,211,153,0.18)"
                  : "rgba(251,191,36,0.16)",
                boxShadow: `0 0 16px ${
                  isFound
                    ? "rgba(52,211,153,0.45)"
                    : "rgba(251,191,36,0.4)"
                }`,
                pointerEvents: "none",
              }}
            >
              {isFound ? "✓" : "!"}
            </motion.div>
          );
        })}

        <AnimatePresence>
          {wrongFlash && (
            <motion.div
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{
                background: "rgba(248,113,113,0.2)",
                pointerEvents: "none",
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {foundBurst !== null && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18 }}
              className="absolute left-1/2 top-2 -translate-x-1/2 rounded-xl px-4 py-2"
              style={{
                background: "rgba(52,211,153,0.25)",
                border: "1px solid rgba(52,211,153,0.55)",
                color: "#34D399",
                fontWeight: 700,
                pointerEvents: "none",
              }}
            >
              Difference found!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {phase === "submitting" && (
        <div
          className="rounded-xl px-4 py-3 text-center"
          style={{
            background: "rgba(34,211,238,0.08)",
            border: "1px solid rgba(34,211,238,0.25)",
            color: "#67E8F9",
          }}
        >
          Saving result...
        </div>
      )}

      <div className="flex items-center justify-between">
        <span style={{ color: "#6B7280", fontSize: "0.7rem" }}>
          Tap the second image to mark differences
        </span>

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={handleHint}
          disabled={hintsLeft <= 0 || phase !== "playing"}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2"
          style={{
            background:
              hintsLeft > 0
                ? "rgba(251,191,36,0.15)"
                : "rgba(255,255,255,0.04)",
            border:
              hintsLeft > 0
                ? "1px solid rgba(251,191,36,0.4)"
                : "1px solid rgba(255,255,255,0.07)",
            color: hintsLeft > 0 ? "#FBBF24" : "#6B7280",
          }}
        >
          <Lightbulb size={13} />
          HINT ({hintsLeft})
        </motion.button>
      </div>

      <div
        className="rounded-2xl px-4 py-3"
        style={{
          background: "rgba(10,15,30,0.8)",
          border: "1px solid rgba(109,40,217,0.2)",
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span
            style={{
              color: "#6B7280",
              fontSize: "0.68rem",
              fontWeight: 700,
            }}
          >
            DIFFERENCES
          </span>
          <span
            style={{
              color: "#34D399",
              fontSize: "0.68rem",
              fontWeight: 700,
            }}
          >
            {found.size}/{requiredCount}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {Array.from({ length: requiredCount }).map((_, index) => {
            const point = differences[index];
            const isFound = point ? found.has(point.id) : false;
            const isHinted = point ? hinted.has(point.id) : false;

            return (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg px-1 py-1"
              >
                <div
                  className="flex h-4 w-4 items-center justify-center rounded-full"
                  style={{
                    background: isFound
                      ? "#34D399"
                      : isHinted
                        ? "rgba(251,191,36,0.2)"
                        : "rgba(255,255,255,0.07)",
                    color: "#111827",
                    fontSize: "0.6rem",
                  }}
                >
                  {isFound ? "✓" : isHinted ? "!" : ""}
                </div>

                <span
                  style={{
                    color: isFound
                      ? "#34D399"
                      : isHinted
                        ? "#FBBF24"
                        : "#9CA3AF",
                    fontSize: "0.75rem",
                  }}
                >
                  {isFound && point?.label
                    ? point.label
                    : `Difference #${index + 1}`}
                </span>

                {isFound && (
                  <CheckCircle2
                    size={11}
                    style={{
                      color: "#34D399",
                      marginLeft: "auto",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ImageLabel({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-px flex-1"
        style={{ background: `${color}33` }}
      />
      <span
        style={{
          color,
          fontSize: "0.65rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
      <div
        className="h-px flex-1"
        style={{ background: `${color}33` }}
      />
    </div>
  );
}

function ImagePanel({
  url,
  alt,
  borderColor,
}: {
  url: string;
  alt: string;
  borderColor: string;
}) {
  return (
    <div
      className="w-full overflow-hidden rounded-2xl"
      style={{
        border: `1.5px solid ${borderColor}`,
        boxShadow: "0 0 24px rgba(34,211,238,0.1)",
      }}
    >
      <ImageContent url={url} alt={alt} />
    </div>
  );
}

function ImageContent({
  url,
  alt,
}: {
  url: string;
  alt: string;
}) {
  if (!url) {
    return (
      <div
        className="flex aspect-video items-center justify-center"
        style={{
          background: "#0F1C3A",
          color: "#9CA3AF",
        }}
      >
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className="block aspect-video w-full object-cover"
      draggable={false}
    />
  );
}

function ResultScreen({
  success,
  foundCount,
  total,
  points,
  timeLeft,
  onRestart,
  onBack,
}: {
  success: boolean;
  foundCount: number;
  total: number;
  points: number;
  timeLeft: number;
  onRestart: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-5 py-4"
    >
      <div className="text-6xl">
        {success ? "🎉" : "⏰"}
      </div>

      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 900,
          fontSize: "1.7rem",
          color: success ? "#34D399" : "#F87171",
        }}
      >
        {success ? "EXCELLENT!" : "TIME'S UP!"}
      </div>

      <div className="grid w-full grid-cols-3 gap-2.5">
        {[
          ["Found", `${foundCount}/${total}`, "🔎"],
          ["Points", `+${points}`, "⭐"],
          ["Time Left", `${timeLeft}s`, "⏱️"],
        ].map(([label, value, icon]) => (
          <div
            key={label}
            className="flex flex-col items-center rounded-2xl py-4"
            style={{
              background: "#0F1C3A",
              border: "1px solid rgba(109,40,217,0.2)",
            }}
          >
            <span>{icon}</span>
            <strong style={{ color: "#F9FAFB" }}>{value}</strong>
            <span style={{ color: "#9CA3AF", fontSize: "0.65rem" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="w-full rounded-2xl py-3.5"
        style={{
          background: "linear-gradient(135deg, #0E47A1, #6D28D9)",
          color: "#FFFFFF",
        }}
      >
        {success ? "NEXT LEVEL" : "TRY AGAIN"}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-2xl py-3"
        style={{
          background: "rgba(34,211,238,0.07)",
          border: "1px solid rgba(34,211,238,0.25)",
          color: "#67E8F9",
        }}
      >
        BACK TO HOME
      </button>
    </motion.div>
  );
}

function StatusCard({
  emoji,
  title,
  message,
  actionLabel,
  onAction,
  onBack,
}: {
  emoji: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="flex min-h-[440px] items-center justify-center">
      <div
        className="w-full max-w-sm rounded-2xl px-6 py-6 text-center"
        style={{
          background: "#0F1C3A",
          border: "1px solid rgba(109,40,217,0.25)",
          color: "#F9FAFB",
        }}
      >
        <div className="mb-3 text-4xl">{emoji}</div>
        <h2>{title}</h2>
        <p style={{ color: "#9CA3AF" }}>{message}</p>

        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-4 w-full rounded-xl py-3"
            style={{
              background: "linear-gradient(135deg, #0E47A1, #6D28D9)",
              color: "#FFFFFF",
            }}
          >
            {actionLabel}
          </button>
        )}

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-3 w-full rounded-xl py-3"
            style={{
              background: "rgba(109,40,217,0.08)",
              color: "#A78BFA",
            }}
          >
            BACK TO HOME
          </button>
        )}
      </div>
    </div>
  );
}

function parseDifferences(value: unknown): DifferencePoint[] {
  let raw = value;

  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw)
  ) {
    const objectValue = raw as Record<string, unknown>;
    raw =
      objectValue.differences ??
      objectValue.hotspots ??
      objectValue.points ??
      [];
  }

  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry, index): DifferencePoint | null => {
      if (!entry || typeof entry !== "object") return null;

      const point = entry as Record<string, unknown>;

      const x = Number(
        point.x_percent ??
          point.x ??
          point.left,
      );

      const y = Number(
        point.y_percent ??
          point.y ??
          point.top,
      );

      const radius = Number(
        point.radius_percent ??
          point.radius ??
          point.r ??
          5,
      );

      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(radius)
      ) {
        return null;
      }

      return {
        id: Number(point.id ?? index + 1),
        x: normalizeCoordinate(x),
        y: normalizeCoordinate(y),
        radius: Math.max(
          1.5,
          Math.min(normalizeRadius(radius), 20),
        ),
        label:
          typeof point.label === "string"
            ? point.label
            : undefined,
      };
    })
    .filter(
      (entry): entry is DifferencePoint =>
        entry !== null,
    );
}

function normalizeCoordinate(value: number): number {
  if (value >= 0 && value <= 1) {
    return value * 100;
  }

  return Math.max(0, Math.min(value, 100));
}

function normalizeRadius(value: number): number {
  if (value > 0 && value <= 1) {
    return value * 100;
  }

  return value;
}

function normalizeError(
  unknownError: unknown,
): GameAPIError {
  if (unknownError instanceof GameAPIError) {
    return unknownError;
  }

  return new GameAPIError({
    code: "FIND_DIFFERENCE_ERROR",
    message:
      unknownError instanceof Error
        ? unknownError.message
        : "Find the Difference operation failed",
  });
}
