import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Brain,
  Star,
  Flame,
  TrendingUp,
} from "lucide-react";

import type { AppLanguage } from "../../api";
import { useGame } from "../../hooks/useGame";

const DIFFICULTY_META: Record<string, { color: string; glow: string }> = {
  EASY: { color: "#34D399", glow: "rgba(52,211,153,0.25)" },
  MEDIUM: { color: "#FBBF24", glow: "rgba(251,191,36,0.25)" },
  HARD: { color: "#F87171", glow: "rgba(248,113,113,0.25)" },
};

const CATEGORY_ICONS: Record<string, string> = {
  Geography: "🌍",
  Science: "🔬",
  Astronomy: "🌌",
  History: "📜",
  Chemistry: "⚗️",
  Physics: "⚡",
  Art: "🎨",
  general: "🧠",
  Default: "🧠",
};

const LEVEL_CAP = 55000;

interface GeneralKnowledgePageProps {
  onBack: () => void;
  userPoints: number;
  onPointsUpdate: (points: number) => void;
  language?: AppLanguage;
}

export function GeneralKnowledgePage({
  onBack,
  userPoints,
  onPointsUpdate,
  language = "en",
}: GeneralKnowledgePageProps) {
  const game = useGame({
    type: "quiz",
    language,
    questionLimit: 10,
    defaultTimeSeconds: 20,
  });

  const answers = useMemo(
    () =>
      [
        game.currentQuestion?.option_a,
        game.currentQuestion?.option_b,
        game.currentQuestion?.option_c,
        game.currentQuestion?.option_d,
      ].filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    [game.currentQuestion],
  );

  if (game.loading && !game.currentQuestion) {
    return <StatusCard emoji="🧠" title="Loading questions..." message="Preparing your next challenge." />;
  }

  if (game.error && !game.currentQuestion) {
    return (
      <StatusCard
        emoji="⚠️"
        title="Unable to load the game"
        message={game.error.message}
        actionLabel="TRY AGAIN"
        onAction={() => void game.retry()}
        onBack={onBack}
      />
    );
  }

  if (game.finished) {
    if (game.empty && game.currentIndex === 0) {
      return (
        <StatusCard
          emoji="📭"
          title="No questions available"
          message="There are no active questions for this language right now."
          actionLabel="BACK TO HOME"
          onAction={onBack}
        />
      );
    }

    return (
      <ResultScreen
        correct={game.correctCount}
        total={Math.max(game.currentIndex + (game.lastResult ? 1 : 0), 1)}
        points={game.score}
        onRestart={() => void game.restart()}
        onBack={onBack}
      />
    );
  }

  const question = game.currentQuestion;
  if (!question) {
    return <StatusCard emoji="⚠️" title="Question unavailable" message="The next question could not be loaded." />;
  }

  const category = String(question.category ?? "general");
  const difficulty = String(question.difficulty ?? "easy").toUpperCase();
  const diffMeta = DIFFICULTY_META[difficulty] ?? DIFFICULTY_META.EASY;
  const timeLimit =
    Number(question.time_limit) > 0 && Number(question.time_limit) <= 300
      ? Number(question.time_limit)
      : 20;
  const timerPct = Math.max(0, Math.min((game.timeLeft / timeLimit) * 100, 100));
  const timerColor =
    game.timeLeft > timeLimit * 0.6
      ? "#22D3EE"
      : game.timeLeft > timeLimit * 0.3
        ? "#FBBF24"
        : "#F87171";
  const isAnswered = Boolean(game.lastResult);
  const timedOut = game.selectedAnswer === "__TIMEOUT__";
  const correctAnswer = game.lastResult?.correct_answer ?? null;

  async function handleNext() {
    if (game.lastResult?.user?.points !== undefined) {
      onPointsUpdate(game.lastResult.user.points);
    }
    await game.goNextQuestion();
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
            background: "rgba(34,211,238,0.1)",
            border: "1px solid rgba(34,211,238,0.3)",
            color: "#67E8F9",
          }}
        >
          <ArrowLeft size={15} />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.82rem" }}>Back</span>
        </motion.button>

        <div className="flex items-center gap-2">
          <StatPill icon={<Star size={12} />} value={`+${game.score}`} color="#FBBF24" />
          <StatPill icon={<Flame size={12} />} value={String(game.correctCount)} color="#F87171" />
        </div>
      </div>

      <div
        className="rounded-2xl px-4 py-3"
        style={{
          background: "linear-gradient(135deg, #0F1C3A, #1A1040)",
          border: "1px solid rgba(34,211,238,0.18)",
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={12} style={{ color: "#22D3EE" }} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.7rem", color: "#67E8F9" }}>
              GENERAL KNOWLEDGE
            </span>
          </div>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.68rem", color: "#6B7280" }}>
            {userPoints.toLocaleString()} / {LEVEL_CAP.toLocaleString()} XP
          </span>
        </div>

        <div className="h-1.5 w-full rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
          <motion.div
            animate={{ width: `${Math.min((userPoints / LEVEL_CAP) * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #6D28D9, #22D3EE)" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "1.1rem" }}>{CATEGORY_ICONS[category] ?? CATEGORY_ICONS.Default}</span>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.72rem", color: "#9CA3AF" }}>
            {category.toUpperCase()} · Q{game.currentIndex + 1}/{game.questionLimit}
          </span>
        </div>

        <span
          className="rounded-full px-2 py-0.5"
          style={{
            background: diffMeta.glow,
            border: `1px solid ${diffMeta.color}55`,
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: "0.62rem",
            color: diffMeta.color,
          }}
        >
          {difficulty}
        </span>
      </div>

      <div className="flex justify-center gap-1.5">
        {Array.from({ length: game.questionLimit }).map((_, index) => (
          <div
            key={index}
            className="rounded-full transition-all duration-300"
            style={{
              width: index === game.currentIndex ? 20 : 6,
              height: 6,
              background:
                index < game.currentIndex
                  ? "#22D3EE"
                  : index === game.currentIndex
                    ? "linear-gradient(90deg, #6D28D9, #22D3EE)"
                    : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: "#0F1C3A", border: `1.5px solid ${timerColor}55` }}
      >
        <Clock size={15} style={{ color: timerColor }} />
        <div className="h-1.5 flex-1 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
          <motion.div
            animate={{ width: `${timerPct}%` }}
            transition={{ duration: 0.9, ease: "linear" }}
            className="h-full rounded-full"
            style={{ background: timerColor }}
          />
        </div>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, color: timerColor }}>
          {game.timeLeft}s
        </span>
        <div className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "rgba(251,191,36,0.12)" }}>
          <Zap size={10} style={{ color: "#FBBF24" }} />
          <span style={{ color: "#FBBF24", fontSize: "0.62rem" }}>+{Number(question.points ?? 0)}</span>
        </div>
      </div>

      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 28 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative rounded-2xl px-5 py-5"
        style={{
          background: "linear-gradient(145deg, #0F1C3A 0%, #1A1040 100%)",
          border: "1.5px solid rgba(34,211,238,0.2)",
          boxShadow: "0 0 28px rgba(34,211,238,0.08)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.3)" }}
          >
            <Brain size={17} style={{ color: "#22D3EE" }} />
          </div>
          <p style={{ color: "#F0F9FF", lineHeight: 1.65, margin: 0 }}>
            {String(question.question ?? "")}
          </p>
        </div>
      </motion.div>

      <div className="flex flex-col gap-2.5">
        {answers.map((answer, index) => {
          const selected = game.selectedAnswer === answer;
          const correct =
            correctAnswer !== null &&
            normalize(answer) === normalize(correctAnswer);
          const showCorrect = isAnswered && correct;
          const showWrong = isAnswered && selected && !correct;

          return (
            <motion.button
              type="button"
              key={answer}
              whileTap={!isAnswered && !game.submitting ? { scale: 0.97 } : {}}
              onClick={() => void game.submitAnswer(answer)}
              disabled={isAnswered || game.submitting}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left"
              style={{
                background: showCorrect
                  ? "rgba(16,185,129,0.16)"
                  : showWrong
                    ? "rgba(248,113,113,0.16)"
                    : "#0F1C3A",
                border: `1.5px solid ${
                  showCorrect ? "#10B981" : showWrong ? "#F87171" : "rgba(34,211,238,0.15)"
                }`,
                color: showCorrect ? "#6EE7B7" : showWrong ? "#FCA5A5" : "#CBD5E1",
              }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: "rgba(34,211,238,0.12)" }}
              >
                {["A", "B", "C", "D"][index]}
              </div>
              <span className="flex-1">{answer}</span>
              {showCorrect && <CheckCircle2 size={16} style={{ color: "#10B981" }} />}
              {showWrong && <XCircle size={16} style={{ color: "#F87171" }} />}
              {game.submitting && selected && <span>...</span>}
            </motion.button>
          );
        })}
      </div>

      {timedOut && isAnswered && (
        <div
          className="flex items-center justify-center gap-2 rounded-xl py-2"
          style={{ background: "rgba(248,113,113,0.1)", color: "#FCA5A5" }}
        >
          <Clock size={13} />
          Time&apos;s up! The correct answer is shown.
        </div>
      )}

      {game.error && game.currentQuestion && (
        <div className="rounded-xl px-4 py-3 text-center" style={{ color: "#FCA5A5" }}>
          {game.error.message}
        </div>
      )}

      <AnimatePresence>
        {isAnswered && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2.5">
            <div
              className="flex items-center justify-center gap-2 rounded-xl py-2.5"
              style={{
                background: game.lastResult?.is_correct
                  ? "rgba(16,185,129,0.1)"
                  : "rgba(248,113,113,0.1)",
                color: game.lastResult?.is_correct ? "#6EE7B7" : "#FCA5A5",
              }}
            >
              {game.lastResult?.is_correct ? (
                <>
                  <CheckCircle2 size={14} />
                  Correct! +{game.lastResult.points_earned} points earned
                </>
              ) : (
                <>
                  <XCircle size={14} />
                  Wrong answer — 0 points
                </>
              )}
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => void handleNext()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5"
              style={{
                background: "linear-gradient(135deg, #0E47A1, #6D28D9)",
                color: "#fff",
              }}
            >
              {game.currentIndex + 1 >= game.questionLimit ? "SEE RESULTS" : "NEXT QUESTION"}
              <ChevronRight size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatPill({ icon, value, color }: { icon: React.ReactNode; value: string; color: string }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
      style={{ background: `${color}18`, border: `1px solid ${color}44`, color }}
    >
      {icon}
      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>{value}</span>
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
      <div className="w-full max-w-sm rounded-2xl px-6 py-6 text-center" style={{ background: "#0F1C3A", color: "#F9FAFB" }}>
        <div className="mb-3 text-4xl">{emoji}</div>
        <h2>{title}</h2>
        <p style={{ color: "#9CA3AF" }}>{message}</p>
        {actionLabel && onAction && (
          <button type="button" onClick={onAction} className="mt-4 w-full rounded-xl py-3" style={{ background: "#6D28D9", color: "#fff" }}>
            {actionLabel}
          </button>
        )}
        {onBack && (
          <button type="button" onClick={onBack} className="mt-3 w-full rounded-xl py-3" style={{ color: "#67E8F9" }}>
            BACK TO HOME
          </button>
        )}
      </div>
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
  const accuracy = Math.round((correct / Math.max(total, 1)) * 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-5 py-4">
      <div className="text-6xl">🧠</div>
      <h2 style={{ color: "#22D3EE" }}>QUIZ COMPLETE!</h2>
      <div className="grid w-full grid-cols-3 gap-2.5">
        {[
          ["Correct", correct, "✅"],
          ["Accuracy", `${accuracy}%`, "🎯"],
          ["Points", `+${points}`, "🪙"],
        ].map(([label, value, icon]) => (
          <div key={String(label)} className="rounded-2xl py-4 text-center" style={{ background: "#0F1C3A" }}>
            <div>{icon}</div>
            <strong style={{ color: "#F9FAFB" }}>{value}</strong>
            <div style={{ color: "#6B7280", fontSize: "0.7rem" }}>{label}</div>
          </div>
        ))}
      </div>
      <button type="button" onClick={onRestart} className="w-full rounded-2xl py-3.5" style={{ background: "#6D28D9", color: "#fff" }}>
        PLAY AGAIN
      </button>
      <button type="button" onClick={onBack} className="w-full rounded-2xl py-3" style={{ color: "#67E8F9" }}>
        BACK TO HOME
      </button>
    </motion.div>
  );
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
