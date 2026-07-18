import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Zap,
  Clock,
  Star,
  Timer,
} from "lucide-react";

import type { AppLanguage } from "../../api";
import { useGame } from "../../hooks/useGame";

interface FastestPageProps {
  onBack: () => void;
  userPoints: number;
  onPointsUpdate: (points: number) => void;
  language?: AppLanguage;
}

type Phase = "intro" | "playing";

const DIFFICULTY_META: Record<string, string> = {
  EASY: "#34D399",
  MEDIUM: "#FBBF24",
  HARD: "#F87171",
};

export function FastestPage({
  onBack,
  userPoints,
  onPointsUpdate,
  language = "en",
}: FastestPageProps) {
  const [phase, setPhase] = useState<Phase>("intro");

  const {
    currentQuestion,
    currentIndex,
    questionLimit,
    score,
    correctCount,
    finished,
    completed,
    empty,
    loading,
    submitting,
    error,
    lastResult,
    selectedAnswer,
    timeLeft,
    submitAnswer,
    goNextQuestion,
    restart,
    retry,
  } = useGame({
    type: "fastest",
    language,
    questionLimit: 10,
    defaultTimeSeconds: 10,
  });

  const answers = useMemo(
    () =>
      [
        currentQuestion?.option_a,
        currentQuestion?.option_b,
        currentQuestion?.option_c,
        currentQuestion?.option_d,
      ].filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      ),
    [currentQuestion],
  );

  const difficulty = String(
    currentQuestion?.difficulty ?? "easy",
  ).toUpperCase();

  const timeLimit =
    Number(currentQuestion?.time_limit) > 0
      ? Number(currentQuestion?.time_limit)
      : 10;

  const timerPercent = Math.max(
    0,
    Math.min((timeLeft / timeLimit) * 100, 100),
  );

  const timerColor =
    timeLeft > timeLimit * 0.6
      ? "#22D3EE"
      : timeLeft > timeLimit * 0.3
        ? "#F97316"
        : "#F87171";

  const isAnswered = Boolean(lastResult);
  const timedOut = selectedAnswer === "__TIMEOUT__";
  const correctAnswer = lastResult?.correct_answer ?? null;

  const handleNext = async () => {
    if (lastResult?.user?.points != null) {
      onPointsUpdate(Number(lastResult.user.points));
    }
    await goNextQuestion();
  };

  if (phase === "intro") {
    return (
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{
              background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.35)",
              color: "#FB923C",
            }}
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <div
            className="rounded-full px-3 py-1.5"
            style={{
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.3)",
              color: "#FBBF24",
            }}
          >
            {userPoints.toLocaleString()} pts
          </div>
        </div>

        <div
          className="flex flex-col items-center gap-4 rounded-3xl px-5 py-8"
          style={{
            background:
              "linear-gradient(145deg, rgba(30,10,5,0.95), rgba(10,15,30,0.95))",
            border: "1.5px solid rgba(249,115,22,0.45)",
            boxShadow: "0 0 60px rgba(249,115,22,0.25)",
          }}
        >
          <div className="text-6xl">⚡</div>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 800,
              fontSize: "1.55rem",
              color: "#FFF7ED",
            }}
          >
            FASTEST MODE
          </div>
          <div style={{ color: "#9CA3AF", textAlign: "center" }}>
            Answer quickly. The backend records the real answer time and score.
          </div>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => setPhase("playing")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4"
          style={{
            background:
              "linear-gradient(135deg, #7C2D12, #EA580C, #6D28D9)",
            border: "1.5px solid rgba(249,115,22,0.5)",
            color: "#FFFFFF",
          }}
        >
          <Zap size={18} style={{ color: "#FBBF24" }} />
          START FASTEST MODE
        </motion.button>
      </div>
    );
  }

  if (loading && !currentQuestion) {
    return (
      <StatusCard
        emoji="⚡"
        title="Loading Fastest Mode..."
        message="Preparing the next speed challenge."
      />
    );
  }

  if (error && !currentQuestion) {
    return (
      <StatusCard
        emoji="⚠️"
        title="Unable to load Fastest Mode"
        message={error.message}
        actionLabel="TRY AGAIN"
        onAction={() => void retry()}
        onBack={onBack}
      />
    );
  }

  if (finished || completed || empty) {
    if (empty && currentIndex === 0) {
      return (
        <StatusCard
          emoji="📭"
          title="No Fastest questions available"
          message="There are no active Fastest questions right now."
          actionLabel="BACK TO HOME"
          onAction={onBack}
        />
      );
    }

    return (
      <ResultScreen
        correct={correctCount}
        total={Math.max(currentIndex + (lastResult ? 1 : 0), 1)}
        points={score}
        onRestart={() => {
          void restart();
          setPhase("playing");
        }}
        onBack={onBack}
      />
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3.5 pb-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{
            background: "rgba(249,115,22,0.12)",
            border: "1px solid rgba(249,115,22,0.35)",
            color: "#FB923C",
          }}
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <div
          className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
          style={{
            background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.25)",
            color: "#FBBF24",
          }}
        >
          <Star size={12} />
          +{score}
        </div>
      </div>

      <div
        className="rounded-2xl px-4 py-3"
        style={{
          background:
            "linear-gradient(135deg, rgba(249,115,22,0.18), rgba(15,28,58,0.92))",
          border: "1px solid rgba(249,115,22,0.4)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} style={{ color: "#F97316" }} />
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                color: "#FFF7ED",
              }}
            >
              FASTEST MODE
            </span>
          </div>

          <span
            style={{
              color: DIFFICULTY_META[difficulty] ?? "#34D399",
              fontWeight: 700,
              fontSize: "0.7rem",
            }}
          >
            {difficulty}
          </span>
        </div>

        <div className="mt-2 text-xs" style={{ color: "#9CA3AF" }}>
          Q{currentIndex + 1} / {questionLimit}
        </div>
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          background: "rgba(10,15,30,0.85)",
          border: `2px solid ${timerColor}66`,
        }}
      >
        <Timer size={15} style={{ color: timerColor }} />
        <div
          className="h-2 flex-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          <motion.div
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 0.9, ease: "linear" }}
            className="h-full rounded-full"
            style={{ background: timerColor }}
          />
        </div>
        <span
          style={{
            color: timerColor,
            fontWeight: 800,
            minWidth: 32,
            textAlign: "right",
          }}
        >
          {timeLeft}s
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          className="rounded-2xl px-5 py-5"
          style={{
            background:
              "linear-gradient(145deg, rgba(10,15,30,0.9), rgba(26,16,64,0.85))",
            border: "1.5px solid rgba(249,115,22,0.28)",
          }}
        >
          <div className="flex items-start gap-3">
            <Zap size={18} style={{ color: "#F97316", flexShrink: 0 }} />
            <p
              style={{
                color: "#FFF7ED",
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {String(currentQuestion.question ?? "")}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col gap-2.5">
        {answers.map((answer, index) => {
          const selected = selectedAnswer === answer;
          const correct =
            correctAnswer !== null &&
            normalize(answer) === normalize(correctAnswer);
          const showCorrect = isAnswered && correct;
          const showWrong = isAnswered && selected && !correct;

          let background =
            "linear-gradient(135deg, rgba(10,15,30,0.88), rgba(26,16,64,0.72))";
          let border = "rgba(249,115,22,0.2)";
          let color = "#CBD5E1";

          if (showCorrect) {
            background =
              "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(16,185,129,0.08))";
            border = "#10B981";
            color = "#6EE7B7";
          } else if (showWrong) {
            background =
              "linear-gradient(135deg, rgba(248,113,113,0.22), rgba(248,113,113,0.08))";
            border = "#F87171";
            color = "#FCA5A5";
          } else if (isAnswered) {
            background = "rgba(8,12,24,0.7)";
            border = "rgba(255,255,255,0.04)";
            color = "#374151";
          }

          return (
            <motion.button
              type="button"
              key={answer}
              whileTap={!isAnswered && !submitting ? { scale: 0.97 } : {}}
              onClick={() => void submitAnswer(answer)}
              disabled={isAnswered || submitting}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left"
              style={{
                background,
                border: `1.5px solid ${border}`,
                color,
              }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  background: "rgba(249,115,22,0.15)",
                  border: "1px solid rgba(249,115,22,0.3)",
                  color: "#F97316",
                }}
              >
                {["A", "B", "C", "D"][index]}
              </div>
              <span style={{ flex: 1 }}>{answer}</span>
              {showCorrect && <CheckCircle2 size={16} />}
              {showWrong && <XCircle size={16} />}
            </motion.button>
          );
        })}
      </div>

      {timedOut && isAnswered && (
        <div
          className="flex items-center justify-center gap-2 rounded-xl py-2"
          style={{
            background: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.3)",
            color: "#FCA5A5",
          }}
        >
          <Clock size={13} />
          Time&apos;s up! Correct answer shown.
        </div>
      )}

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-center"
          style={{
            background: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.3)",
            color: "#FCA5A5",
          }}
        >
          {error.message}
        </div>
      )}

      {isAnswered && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => void handleNext()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5"
          style={{
            background:
              "linear-gradient(135deg, #7C2D12, #EA580C, #6D28D9)",
            color: "#FFFFFF",
          }}
        >
          {currentIndex + 1 >= questionLimit
            ? "SEE RESULTS"
            : "NEXT QUESTION"}
          <ChevronRight size={16} />
        </motion.button>
      )}
    </div>
  );
}

function ResultScreen({
  correct,
  total,
  points,
  onRestart,
  onBack,
}: {
  correct: number;
  total: number;
  points: number;
  onRestart: () => void;
  onBack: () => void;
}) {
  const accuracy = Math.round(
    (correct / Math.max(total, 1)) * 100,
  );

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="text-6xl">
        {accuracy >= 70 ? "🔥" : "⚡"}
      </div>
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 800,
          fontSize: "1.6rem",
          color: "#F97316",
        }}
      >
        FASTEST RESULTS
      </div>

      <div className="grid w-full grid-cols-3 gap-2.5">
        {[
          ["Correct", String(correct), "✅"],
          ["Accuracy", `${accuracy}%`, "🎯"],
          ["Points", `+${points}`, "🪙"],
        ].map(([label, value, icon]) => (
          <div
            key={label}
            className="flex flex-col items-center rounded-2xl py-4"
            style={{
              background: "#0F1C3A",
              border: "1px solid rgba(249,115,22,0.2)",
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
          background:
            "linear-gradient(135deg, #7C2D12, #EA580C, #6D28D9)",
          color: "#FFFFFF",
        }}
      >
        PLAY AGAIN
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-2xl py-3"
        style={{
          background: "rgba(249,115,22,0.08)",
          border: "1px solid rgba(249,115,22,0.28)",
          color: "#FB923C",
        }}
      >
        BACK TO HOME
      </button>
    </div>
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
          border: "1px solid rgba(249,115,22,0.25)",
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
              background:
                "linear-gradient(135deg, #7C2D12, #EA580C, #6D28D9)",
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
              background: "rgba(249,115,22,0.08)",
              color: "#FB923C",
            }}
          >
            BACK TO HOME
          </button>
        )}
      </div>
    </div>
  );
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
