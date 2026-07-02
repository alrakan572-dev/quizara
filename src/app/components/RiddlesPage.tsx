import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Clock, Zap, CheckCircle2, XCircle, ChevronRight, Trophy, Star } from "lucide-react";

const RIDDLES = [
  {
    id: 1,
    question: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?",
    answers: ["A shadow", "An echo", "A dream", "A mirror"],
    correct: 1,
    points: 150,
    difficulty: "MEDIUM",
  },
  {
    id: 2,
    question: "The more you take, the more you leave behind. What am I?",
    answers: ["Time", "Money", "Footsteps", "Memories"],
    correct: 2,
    points: 100,
    difficulty: "EASY",
  },
  {
    id: 3,
    question: "I have cities, but no houses live there. I have mountains, but no trees grow. I have water, but no fish swim. I have roads, but no cars drive. What am I?",
    answers: ["A painting", "A map", "A dream", "A globe"],
    correct: 1,
    points: 200,
    difficulty: "HARD",
  },
  {
    id: 4,
    question: "What has hands but can't clap?",
    answers: ["A statue", "A robot", "A clock", "A puppet"],
    correct: 2,
    points: 100,
    difficulty: "EASY",
  },
  {
    id: 5,
    question: "I'm light as a feather, but even the world's strongest man can't hold me for more than a few minutes. What am I?",
    answers: ["A secret", "Breath", "A thought", "Sunlight"],
    correct: 1,
    points: 150,
    difficulty: "MEDIUM",
  },
  {
    id: 6,
    question: "The more you have of it, the less you see. What is it?",
    answers: ["Money", "Friends", "Darkness", "Knowledge"],
    correct: 2,
    points: 150,
    difficulty: "MEDIUM",
  },
  {
    id: 7,
    question: "I have a tail and a head, but no body. What am I?",
    answers: ["A coin", "A comet", "A snake", "A meteor"],
    correct: 0,
    points: 200,
    difficulty: "HARD",
  },
  {
    id: 8,
    question: "What comes once in a minute, twice in a moment, but never in a thousand years?",
    answers: ["Luck", "The letter M", "A wish", "A second"],
    correct: 1,
    points: 250,
    difficulty: "HARD",
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "#10B981",
  MEDIUM: "#FBBF24",
  HARD: "#EF4444",
};

const TIMER_TOTAL = 20;

interface RiddlesPageProps {
  onBack: () => void;
  userPoints: number;
  onPointsUpdate: (pts: number) => void;
}

type AnswerState = "idle" | "correct" | "wrong";

export function RiddlesPage({ onBack, userPoints, onPointsUpdate }: RiddlesPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const riddle = RIDDLES[currentIndex];
  const isAnswered = answerState !== "idle";
  const isLast = currentIndex === RIDDLES.length - 1;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTimeout = useCallback(() => {
    stopTimer();
    setTimedOut(true);
    setAnswerState("wrong");
  }, [stopTimer]);

  useEffect(() => {
    if (isAnswered) return;
    setTimeLeft(TIMER_TOTAL);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => stopTimer();
  }, [currentIndex, isAnswered, handleTimeout, stopTimer]);

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    stopTimer();
    setSelectedAnswer(index);
    const correct = index === riddle.correct;
    setAnswerState(correct ? "correct" : "wrong");
    setTimedOut(false);
    if (correct) {
      setSessionPoints((p) => p + riddle.points);
      setCorrectCount((c) => c + 1);
      onPointsUpdate(userPoints + riddle.points);
    }
  };

  const handleNext = () => {
    if (isLast) {
      setShowResult(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedAnswer(null);
    setAnswerState("idle");
    setTimedOut(false);
    setTimeLeft(TIMER_TOTAL);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswerState("idle");
    setTimedOut(false);
    setTimeLeft(TIMER_TOTAL);
    setSessionPoints(0);
    setCorrectCount(0);
    setShowResult(false);
  };

  const timerPct = (timeLeft / TIMER_TOTAL) * 100;
  const timerColor =
    timeLeft > 12 ? "#10B981" : timeLeft > 6 ? "#FBBF24" : "#EF4444";

  if (showResult) {
    return <ResultScreen
      correct={correctCount}
      total={RIDDLES.length}
      points={sessionPoints}
      onRestart={handleRestart}
      onBack={onBack}
    />;
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
          style={{
            background: "rgba(109,40,217,0.15)",
            border: "1px solid rgba(109,40,217,0.3)",
            color: "#A78BFA",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.82rem" }}>Back</span>
        </motion.button>

        {/* Session score */}
        <div
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
          style={{
            background: "rgba(251,191,36,0.12)",
            border: "1px solid rgba(251,191,36,0.3)",
          }}
        >
          <Star size={13} style={{ color: "#FBBF24" }} />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#FBBF24" }}>
            +{sessionPoints} pts
          </span>
        </div>
      </div>

      {/* Progress + question counter */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.72rem", color: "#9CA3AF" }}>
            Question {currentIndex + 1} of {RIDDLES.length}
          </span>
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "0.7rem",
              color: DIFFICULTY_COLORS[riddle.difficulty],
              letterSpacing: "0.08em",
            }}
          >
            {riddle.difficulty}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${((currentIndex + 1) / RIDDLES.length) * 100}%` }}
            transition={{ duration: 0.4 }}
            style={{ background: "linear-gradient(90deg, #6D28D9, #A78BFA)" }}
          />
        </div>
      </div>

      {/* Timer */}
      <motion.div
        className="flex flex-col items-center gap-1.5 py-3 rounded-2xl relative overflow-hidden"
        animate={{
          borderColor: `${timerColor}55`,
          boxShadow: `0 0 20px ${timerColor}22`,
        }}
        style={{
          background: "#1F2937",
          border: `1.5px solid ${timerColor}55`,
        }}
      >
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: timerColor }} />
          <motion.span
            key={timeLeft}
            initial={{ scale: 1.2, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 800,
              fontSize: "1.5rem",
              color: timerColor,
              minWidth: 32,
              textAlign: "center",
            }}
          >
            {timeLeft}s
          </motion.span>
        </div>
        {/* Timer bar */}
        <div className="w-4/5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${timerPct}%` }}
            transition={{ duration: 0.9, ease: "linear" }}
            style={{ background: timerColor }}
          />
        </div>

        {/* Points reward chip */}
        <div
          className="absolute top-2 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}
        >
          <Zap size={11} style={{ color: "#FBBF24" }} />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.68rem", color: "#FBBF24" }}>
            +{riddle.points}
          </span>
        </div>
      </motion.div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={riddle.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.28 }}
          className="rounded-2xl px-5 py-5"
          style={{
            background: "linear-gradient(145deg, #263248, #1F2937)",
            border: "1px solid rgba(109,40,217,0.25)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div className="flex items-start gap-2 mb-1">
            <span style={{ fontSize: "1.3rem" }}>🧩</span>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.97rem",
                color: "#F9FAFB",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {riddle.question}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Answer buttons */}
      <AnimatePresence mode="wait">
        <motion.div
          key={riddle.id + "-answers"}
          className="flex flex-col gap-2.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {riddle.answers.map((answer, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrectAnswer = i === riddle.correct;
            const showCorrect = isAnswered && isCorrectAnswer;
            const showWrong = isAnswered && isSelected && !isCorrectAnswer;

            let bg = "#1F2937";
            let border = "rgba(109,40,217,0.18)";
            let textColor = "#D1D5DB";
            let iconEl: React.ReactNode = null;
            let glowColor = "transparent";

            if (showCorrect) {
              bg = "rgba(16,185,129,0.15)";
              border = "#10B981";
              textColor = "#6EE7B7";
              glowColor = "rgba(16,185,129,0.25)";
              iconEl = <CheckCircle2 size={16} style={{ color: "#10B981", flexShrink: 0 }} />;
            } else if (showWrong) {
              bg = "rgba(239,68,68,0.15)";
              border = "#EF4444";
              textColor = "#FCA5A5";
              glowColor = "rgba(239,68,68,0.2)";
              iconEl = <XCircle size={16} style={{ color: "#EF4444", flexShrink: 0 }} />;
            } else if (isAnswered && !isSelected) {
              bg = "#1a2233";
              border = "rgba(255,255,255,0.05)";
              textColor = "#4B5563";
            }

            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileTap={!isAnswered ? { scale: 0.97 } : {}}
                onClick={() => handleAnswer(i)}
                disabled={isAnswered}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl w-full text-left"
                style={{
                  background: bg,
                  border: `1.5px solid ${border}`,
                  boxShadow: showCorrect || showWrong ? `0 0 16px ${glowColor}` : "none",
                  cursor: isAnswered ? "default" : "pointer",
                  transition: "all 0.25s ease",
                }}
              >
                {/* Letter badge */}
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background: showCorrect
                      ? "#10B98122"
                      : showWrong
                      ? "#EF444422"
                      : "rgba(109,40,217,0.2)",
                    border: showCorrect
                      ? "1px solid #10B98155"
                      : showWrong
                      ? "1px solid #EF444455"
                      : "1px solid rgba(109,40,217,0.3)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      color: showCorrect ? "#10B981" : showWrong ? "#EF4444" : "#A78BFA",
                    }}
                  >
                    {["A", "B", "C", "D"][i]}
                  </span>
                </div>
                <span
                  style={{
                    flex: 1,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.88rem",
                    color: textColor,
                    transition: "color 0.2s",
                  }}
                >
                  {answer}
                </span>
                {iconEl}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Timeout message */}
      <AnimatePresence>
        {timedOut && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-2 rounded-xl"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <Clock size={14} style={{ color: "#EF4444" }} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.82rem", color: "#FCA5A5" }}>
              Time's up! The correct answer was highlighted.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback + Next button */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            {/* Feedback pill */}
            {!timedOut && (
              <div
                className="flex items-center justify-center gap-2 py-2 rounded-xl"
                style={{
                  background: answerState === "correct" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                  border: `1px solid ${answerState === "correct" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}
              >
                {answerState === "correct" ? (
                  <>
                    <CheckCircle2 size={14} style={{ color: "#10B981" }} />
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#6EE7B7" }}>
                      Correct! +{riddle.points} points earned
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} style={{ color: "#EF4444" }} />
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.82rem", color: "#FCA5A5" }}>
                      Wrong answer — 0 points
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Next button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleNext}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl w-full"
              style={{
                background: "linear-gradient(135deg, #6D28D9, #7C3AED)",
                border: "1px solid rgba(167,139,250,0.3)",
                boxShadow: "0 0 20px rgba(109,40,217,0.4)",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#fff",
                  letterSpacing: "0.05em",
                }}
              >
                {isLast ? "SEE RESULTS" : "NEXT RIDDLE"}
              </span>
              <ChevronRight size={16} style={{ color: "#fff" }} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
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
  const pct = Math.round((correct / total) * 100);
  const grade =
    pct >= 90 ? { label: "GENIUS!", emoji: "🧠", color: "#FBBF24" }
    : pct >= 70 ? { label: "GREAT!", emoji: "🏆", color: "#10B981" }
    : pct >= 50 ? { label: "GOOD JOB!", emoji: "⭐", color: "#8B5CF6" }
    : { label: "KEEP TRYING!", emoji: "💪", color: "#F97316" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-5 py-4"
    >
      {/* Trophy graphic */}
      <motion.div
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
        style={{
          background: `linear-gradient(135deg, ${grade.color}33, ${grade.color}11)`,
          border: `2px solid ${grade.color}55`,
          boxShadow: `0 0 40px ${grade.color}33`,
        }}
      >
        {grade.emoji}
      </motion.div>

      <div className="flex flex-col items-center gap-1">
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 800,
            fontSize: "1.6rem",
            color: grade.color,
            letterSpacing: "0.04em",
          }}
        >
          {grade.label}
        </span>
        <span style={{ color: "#9CA3AF", fontSize: "0.8rem" }}>
          {correct} out of {total} correct
        </span>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {[
          { label: "Correct", value: correct, icon: "✅", color: "#10B981" },
          { label: "Score", value: `${pct}%`, icon: "📊", color: "#A78BFA" },
          { label: "Points", value: `+${points}`, icon: "🪙", color: "#FBBF24" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center rounded-2xl py-4"
            style={{
              background: "#1F2937",
              border: `1px solid ${s.color}33`,
              boxShadow: `0 0 12px ${s.color}15`,
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>{s.icon}</span>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 800,
                fontSize: "1.1rem",
                color: s.color,
              }}
            >
              {s.value}
            </span>
            <span style={{ color: "#6B7280", fontSize: "0.62rem" }}>{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Trophy progress */}
      <div
        className="w-full rounded-2xl px-5 py-4"
        style={{ background: "#1F2937", border: "1px solid rgba(109,40,217,0.2)" }}
      >
        <div className="flex justify-between mb-2">
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.75rem", color: "#9CA3AF" }}>
            ACCURACY
          </span>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.75rem", color: grade.color }}>
            {pct}%
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, #6D28D9, ${grade.color})` }}
          />
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <Trophy size={13} style={{ color: "#FBBF24" }} />
          <span style={{ color: "#D1D5DB", fontSize: "0.78rem" }}>
            {points > 0 ? `${points} points added to your total!` : "Keep practicing to earn points!"}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2.5 w-full">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onRestart}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl w-full"
          style={{
            background: "linear-gradient(135deg, #6D28D9, #7C3AED)",
            border: "1px solid rgba(167,139,250,0.3)",
            boxShadow: "0 0 24px rgba(109,40,217,0.4)",
            cursor: "pointer",
          }}
        >
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#fff", letterSpacing: "0.05em" }}>
            PLAY AGAIN
          </span>
          <span style={{ fontSize: "0.9rem" }}>🧩</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl w-full"
          style={{
            background: "rgba(109,40,217,0.12)",
            border: "1px solid rgba(109,40,217,0.3)",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} style={{ color: "#A78BFA" }} />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#A78BFA", letterSpacing: "0.04em" }}>
            BACK TO HOME
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}
