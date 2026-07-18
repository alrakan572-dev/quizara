import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Send,
  Star,
  XCircle,
} from "lucide-react";

import type { AppLanguage } from "../../api";
import { useGame } from "../../hooks/useGame";

interface RiddlesPageProps {
  onBack: () => void;
  userPoints: number;
  onPointsUpdate: (points: number) => void;
  language?: AppLanguage;
}

export function RiddlesPage({
  onBack,
  userPoints,
  onPointsUpdate,
  language = "en",
}: RiddlesPageProps) {
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
    type: "riddle",
    language,
    questionLimit: 10,
    defaultTimeSeconds: 20,
  });

  const [answer, setAnswer] = useState("");

  const isAnswered = Boolean(lastResult);
  const timedOut = selectedAnswer === "__TIMEOUT__";

  const timeLimit =
    Number(currentQuestion?.time_limit) > 0
      ? Number(currentQuestion?.time_limit)
      : 20;

  const timerPercent = Math.max(
    0,
    Math.min((timeLeft / timeLimit) * 100, 100),
  );

  const timerColor =
    timeLeft > timeLimit * 0.6
      ? "#22D3EE"
      : timeLeft > timeLimit * 0.3
        ? "#FBBF24"
        : "#F87171";

  const handleSubmit = async () => {
    const value = answer.trim();

    if (!value || isAnswered || submitting || loading) {
      return;
    }

    await submitAnswer(value);
  };

  const handleNext = async () => {
    if (lastResult?.user?.points != null) {
      onPointsUpdate(Number(lastResult.user.points));
    }

    setAnswer("");
    await goNextQuestion();
  };

  const handleRestart = async () => {
    setAnswer("");
    await restart();
  };

  if (loading && !currentQuestion) {
    return (
      <StatusCard
        emoji="🧩"
        title="Loading riddles..."
        message="Preparing your next riddle."
      />
    );
  }

  if (error && !currentQuestion) {
    return (
      <StatusCard
        emoji="⚠️"
        title="Unable to load riddles"
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
          title="No riddles available"
          message="There are no active riddles for this language right now."
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
        onRestart={() => void handleRestart()}
        onBack={onBack}
      />
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center justify-between">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2"
          style={{
            background: "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.35)",
            color: "#A78BFA",
          }}
        >
          <ArrowLeft size={15} />
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              fontSize: "0.82rem",
            }}
          >
            Back
          </span>
        </motion.button>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
            style={{
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.25)",
            }}
          >
            <Star size={12} style={{ color: "#FBBF24" }} />
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "0.78rem",
                color: "#FBBF24",
              }}
            >
              +{score}
            </span>
          </div>

          <div
            className="rounded-xl px-2.5 py-1.5"
            style={{
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.3)",
              color: "#C4B5FD",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "0.78rem",
            }}
          >
            {userPoints.toLocaleString()} XP
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl px-4 py-3"
        style={{
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(15,28,58,0.92))",
          border: "1px solid rgba(124,58,237,0.4)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={16} style={{ color: "#A78BFA" }} />
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "0.9rem",
                color: "#F5F3FF",
              }}
            >
              RIDDLES
            </span>
          </div>

          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "0.68rem",
              color: "#A78BFA",
            }}
          >
            Q{currentIndex + 1}/{questionLimit}
          </span>
        </div>
      </div>

      <motion.div
        animate={{
          borderColor: `${timerColor}66`,
          boxShadow: `0 0 18px ${timerColor}18`,
        }}
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          background: "#0F1C3A",
          border: `1.5px solid ${timerColor}66`,
        }}
      >
        <Clock size={15} style={{ color: timerColor }} />

        <div
          className="h-1.5 flex-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          <motion.div
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 0.9, ease: "linear" }}
            className="h-full rounded-full"
            style={{
              background: timerColor,
              boxShadow: `0 0 8px ${timerColor}88`,
            }}
          />
        </div>

        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 800,
            fontSize: "1.15rem",
            color: timerColor,
            minWidth: 30,
            textAlign: "right",
          }}
        >
          {timeLeft}s
        </span>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          className="rounded-2xl px-5 py-5"
          style={{
            background:
              "linear-gradient(145deg, #0F1C3A 0%, #1A1040 100%)",
            border: "1.5px solid rgba(124,58,237,0.28)",
            boxShadow:
              "0 0 28px rgba(124,58,237,0.10), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "1rem",
              color: "#F5F3FF",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {String(currentQuestion.question ?? "")}
          </p>
        </motion.div>
      </AnimatePresence>

      <div
        className="rounded-2xl p-4"
        style={{
          background: "rgba(15,28,58,0.78)",
          border: `1.5px solid ${
            lastResult?.is_correct
              ? "#10B981"
              : isAnswered
                ? "#F87171"
                : "rgba(124,58,237,0.28)"
          }`,
        }}
      >
        <label
          htmlFor="riddle-answer"
          style={{
            display: "block",
            marginBottom: 8,
            color: "#C4B5FD",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: "0.8rem",
          }}
        >
          YOUR ANSWER
        </label>

        <input
          id="riddle-answer"
          type="text"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleSubmit();
            }
          }}
          disabled={isAnswered || submitting}
          placeholder="Type your answer here..."
          className="w-full rounded-xl px-4 py-3 outline-none"
          style={{
            background: "rgba(17,24,39,0.9)",
            border: "1px solid rgba(124,58,237,0.25)",
            color: "#F9FAFB",
          }}
        />

        {!isAnswered && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => void handleSubmit()}
            disabled={!answer.trim() || submitting}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3"
            style={{
              background:
                answer.trim() && !submitting
                  ? "linear-gradient(135deg, #6D28D9, #4C1D95)"
                  : "rgba(107,114,128,0.25)",
              color: "#FFFFFF",
              cursor:
                answer.trim() && !submitting
                  ? "pointer"
                  : "not-allowed",
              opacity: answer.trim() && !submitting ? 1 : 0.6,
            }}
          >
            <Send size={15} />
            {submitting ? "SUBMITTING..." : "SUBMIT ANSWER"}
          </motion.button>
        )}
      </div>

      {timedOut && isAnswered && (
        <div
          className="rounded-xl px-4 py-3 text-center"
          style={{
            background: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.3)",
            color: "#FCA5A5",
          }}
        >
          Time&apos;s up!
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2.5"
        >
          <div
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3"
            style={{
              background: lastResult?.is_correct
                ? "rgba(16,185,129,0.1)"
                : "rgba(248,113,113,0.1)",
              border: `1px solid ${
                lastResult?.is_correct
                  ? "rgba(16,185,129,0.35)"
                  : "rgba(248,113,113,0.35)"
              }`,
            }}
          >
            {lastResult?.is_correct ? (
              <>
                <CheckCircle2 size={15} style={{ color: "#10B981" }} />
                <span style={{ color: "#6EE7B7", fontWeight: 700 }}>
                  Correct! +{lastResult.points_earned} points
                </span>
              </>
            ) : (
              <>
                <XCircle size={15} style={{ color: "#F87171" }} />
                <span style={{ color: "#FCA5A5" }}>
                  Correct answer:{" "}
                  <strong>{lastResult?.correct_answer ?? "—"}</strong>
                </span>
              </>
            )}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => void handleNext()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5"
            style={{
              background:
                "linear-gradient(135deg, #6D28D9, #4C1D95)",
              color: "#FFFFFF",
            }}
          >
            {currentIndex + 1 >= questionLimit
              ? "SEE RESULTS"
              : "NEXT RIDDLE"}
            <ChevronRight size={16} />
          </motion.button>
        </motion.div>
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
      <div className="text-6xl">🧩</div>
      <h2
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 800,
          fontSize: "1.6rem",
          color: "#A78BFA",
          margin: 0,
        }}
      >
        RIDDLES RESULTS
      </h2>

      <div className="grid w-full grid-cols-3 gap-2.5">
        {[
          ["Correct", String(correct), "✅"],
          ["Accuracy", `${accuracy}%`, "🎯"],
          ["Points", `+${points}`, "⭐"],
        ].map(([label, value, icon]) => (
          <div
            key={label}
            className="flex flex-col items-center rounded-2xl py-4"
            style={{
              background: "#0F1C3A",
              border: "1px solid rgba(124,58,237,0.2)",
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
          background: "linear-gradient(135deg, #6D28D9, #4C1D95)",
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
          background: "rgba(124,58,237,0.08)",
          border: "1px solid rgba(124,58,237,0.28)",
          color: "#C4B5FD",
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
          border: "1px solid rgba(124,58,237,0.25)",
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
              background: "linear-gradient(135deg, #6D28D9, #4C1D95)",
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
              background: "rgba(124,58,237,0.08)",
              color: "#C4B5FD",
            }}
          >
            BACK TO HOME
          </button>
        )}
      </div>
    </div>
  );
}
