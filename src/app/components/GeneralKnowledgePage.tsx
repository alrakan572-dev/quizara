import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Clock, Zap, CheckCircle2, XCircle,
  ChevronRight, Brain, Star, Flame, TrendingUp,
} from "lucide-react";

const QUESTIONS = [
  {
    id: 1,
    question: "What is the capital city of Australia?",
    answers: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
    correct: 2,
    points: 200,
    difficulty: "EASY",
    category: "Geography",
  },
  {
    id: 2,
    question: "How many bones are in the adult human body?",
    answers: ["196", "206", "216", "226"],
    correct: 1,
    points: 200,
    difficulty: "MEDIUM",
    category: "Science",
  },
  {
    id: 3,
    question: "Which planet in our solar system has the most moons?",
    answers: ["Jupiter", "Saturn", "Uranus", "Neptune"],
    correct: 1,
    points: 250,
    difficulty: "MEDIUM",
    category: "Astronomy",
  },
  {
    id: 4,
    question: "In what year did World War II end?",
    answers: ["1943", "1944", "1945", "1946"],
    correct: 2,
    points: 150,
    difficulty: "EASY",
    category: "History",
  },
  {
    id: 5,
    question: "What is the chemical symbol for gold?",
    answers: ["Go", "Gd", "Au", "Ag"],
    correct: 2,
    points: 200,
    difficulty: "MEDIUM",
    category: "Chemistry",
  },
  {
    id: 6,
    question: "Which country is home to the Great Barrier Reef?",
    answers: ["Brazil", "Australia", "Indonesia", "Philippines"],
    correct: 1,
    points: 150,
    difficulty: "EASY",
    category: "Geography",
  },
  {
    id: 7,
    question: "What is the speed of light in a vacuum (approximately)?",
    answers: ["200,000 km/s", "280,000 km/s", "300,000 km/s", "320,000 km/s"],
    correct: 2,
    points: 300,
    difficulty: "HARD",
    category: "Physics",
  },
  {
    id: 8,
    question: "Who painted the Mona Lisa?",
    answers: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Caravaggio"],
    correct: 2,
    points: 150,
    difficulty: "EASY",
    category: "Art",
  },
  {
    id: 9,
    question: "What is the largest ocean on Earth?",
    answers: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correct: 3,
    points: 150,
    difficulty: "EASY",
    category: "Geography",
  },
  {
    id: 10,
    question: "Which element has the atomic number 1?",
    answers: ["Helium", "Hydrogen", "Lithium", "Carbon"],
    correct: 1,
    points: 200,
    difficulty: "MEDIUM",
    category: "Chemistry",
  },
];

const DIFFICULTY_META: Record<string, { color: string; glow: string }> = {
  EASY:   { color: "#34D399", glow: "rgba(52,211,153,0.25)" },
  MEDIUM: { color: "#FBBF24", glow: "rgba(251,191,36,0.25)" },
  HARD:   { color: "#F87171", glow: "rgba(248,113,113,0.25)" },
};

const CATEGORY_ICONS: Record<string, string> = {
  Geography: "🌍", Science: "🔬", Astronomy: "🌌",
  History: "📜", Chemistry: "⚗️", Physics: "⚡",
  Art: "🎨", Default: "🧠",
};

const TIMER_TOTAL = 20;
const LEVEL_CAP = 55000;

interface GeneralKnowledgePageProps {
  onBack: () => void;
  userPoints: number;
  onPointsUpdate: (pts: number) => void;
}

type AnswerState = "idle" | "correct" | "wrong";

export function GeneralKnowledgePage({ onBack, userPoints, onPointsUpdate }: GeneralKnowledgePageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [showPointsBurst, setShowPointsBurst] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const question = QUESTIONS[currentIndex];
  const isAnswered = answerState !== "idle";
  const isLast = currentIndex === QUESTIONS.length - 1;
  const diffMeta = DIFFICULTY_META[question.difficulty];

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
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
        if (t <= 1) { handleTimeout(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => stopTimer();
  }, [currentIndex, isAnswered, handleTimeout, stopTimer]);

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    stopTimer();
    setSelectedAnswer(index);
    const correct = index === question.correct;
    setAnswerState(correct ? "correct" : "wrong");
    setTimedOut(false);
    if (correct) {
      const earned = question.points;
      setSessionPoints((p) => p + earned);
      setCorrectCount((c) => c + 1);
      onPointsUpdate(userPoints + earned);
      setShowPointsBurst(true);
      setTimeout(() => setShowPointsBurst(false), 1400);
    }
  };

  const handleNext = () => {
    if (isLast) { setShowResult(true); return; }
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
  const timerColor = timeLeft > 12 ? "#22D3EE" : timeLeft > 6 ? "#FBBF24" : "#F87171";

  if (showResult) {
    return (
      <GKResultScreen
        correct={correctCount}
        total={QUESTIONS.length}
        points={sessionPoints}
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
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
            background: "rgba(34,211,238,0.1)",
            border: "1px solid rgba(34,211,238,0.3)",
            color: "#67E8F9",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.82rem" }}>Back</span>
        </motion.button>

        <div className="flex items-center gap-2">
          {/* Session pts */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}
          >
            <Star size={12} style={{ color: "#FBBF24" }} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "#FBBF24" }}>
              +{sessionPoints}
            </span>
          </div>
          {/* Streak */}
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <Flame size={12} style={{ color: "#F87171" }} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "#F87171" }}>
              {correctCount}
            </span>
          </div>
        </div>
      </div>

      {/* Level + progress */}
      <div
        className="rounded-2xl px-4 py-3"
        style={{
          background: "linear-gradient(135deg, #0F1C3A, #1A1040)",
          border: "1px solid rgba(34,211,238,0.18)",
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={12} style={{ color: "#22D3EE" }} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.7rem", color: "#67E8F9" }}>
              LEVEL 23
            </span>
          </div>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.68rem", color: "#6B7280" }}>
            {userPoints.toLocaleString()} / {LEVEL_CAP.toLocaleString()} XP
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
          <motion.div
            animate={{ width: `${Math.min((userPoints / LEVEL_CAP) * 100, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #6D28D9, #22D3EE)" }}
          />
        </div>
      </div>

      {/* Question counter + category */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "1.1rem" }}>
            {CATEGORY_ICONS[question.category] ?? CATEGORY_ICONS.Default}
          </span>
          <div>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.72rem", color: "#9CA3AF" }}>
              {question.category.toUpperCase()} · Q{currentIndex + 1}/{QUESTIONS.length}
            </span>
          </div>
        </div>
        <span
          className="px-2 py-0.5 rounded-full"
          style={{
            background: `${diffMeta.glow}`,
            border: `1px solid ${diffMeta.color}55`,
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: "0.62rem",
            color: diffMeta.color,
            letterSpacing: "0.08em",
          }}
        >
          {question.difficulty}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === currentIndex ? 20 : 6,
              height: 6,
              background: i < currentIndex
                ? "#22D3EE"
                : i === currentIndex
                ? "linear-gradient(90deg, #6D28D9, #22D3EE)"
                : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>

      {/* Timer */}
      <motion.div
        animate={{ borderColor: `${timerColor}55`, boxShadow: `0 0 18px ${timerColor}18` }}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl relative"
        style={{ background: "#0F1C3A", border: `1.5px solid ${timerColor}55` }}
      >
        <Clock size={15} style={{ color: timerColor }} />
        <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
          <motion.div
            animate={{ width: `${timerPct}%` }}
            transition={{ duration: 0.9, ease: "linear" }}
            className="h-full rounded-full"
            style={{ background: timerColor, boxShadow: `0 0 8px ${timerColor}88` }}
          />
        </div>
        <motion.span
          key={timeLeft}
          initial={{ scale: 1.25, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
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
        </motion.span>

        {/* Points reward */}
        <div
          className="absolute top-2 right-3 hidden"
          style={{ display: "none" }}
        />
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full ml-1"
          style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)" }}
        >
          <Zap size={10} style={{ color: "#FBBF24" }} />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.62rem", color: "#FBBF24" }}>
            +{question.points}
          </span>
        </div>
      </motion.div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          transition={{ duration: 0.26, type: "spring", stiffness: 220, damping: 24 }}
          className="rounded-2xl px-5 py-5 relative"
          style={{
            background: "linear-gradient(145deg, #0F1C3A 0%, #1A1040 100%)",
            border: "1.5px solid rgba(34,211,238,0.2)",
            boxShadow: "0 0 28px rgba(34,211,238,0.08), 0 0 48px rgba(109,40,217,0.1), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Glow orbs */}
          <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full opacity-20 blur-2xl" style={{ background: "#22D3EE" }} />
          <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full opacity-20 blur-2xl" style={{ background: "#6D28D9" }} />

          <div className="flex items-start gap-3 relative">
            <div
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
              style={{
                background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(109,40,217,0.2))",
                border: "1px solid rgba(34,211,238,0.3)",
              }}
            >
              <Brain size={17} style={{ color: "#22D3EE" }} />
            </div>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.97rem",
                color: "#F0F9FF",
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {question.question}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Points burst animation */}
      <AnimatePresence>
        {showPointsBurst && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: 1, y: -28, scale: 1 }}
            exit={{ opacity: 0, y: -52, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-1.5 pointer-events-none"
            style={{ position: "relative", zIndex: 50 }}
          >
            <div
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(34,211,238,0.2))",
                border: "1.5px solid #10B98188",
                boxShadow: "0 0 24px rgba(16,185,129,0.4)",
              }}
            >
              <CheckCircle2 size={15} style={{ color: "#34D399" }} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#34D399" }}>
                +{question.points} POINTS EARNED!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer buttons */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id + "-answers"}
          className="flex flex-col gap-2.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {question.answers.map((answer, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrectAnswer = i === question.correct;
            const showCorrect = isAnswered && isCorrectAnswer;
            const showWrong = isAnswered && isSelected && !isCorrectAnswer;

            let bg = "linear-gradient(135deg, #0F1C3A, #111827)";
            let border = "rgba(34,211,238,0.15)";
            let textColor = "#CBD5E1";
            let badgeBg = "rgba(34,211,238,0.12)";
            let badgeBorder = "rgba(34,211,238,0.25)";
            let badgeColor = "#22D3EE";
            let glowShadow = "none";
            let iconEl: React.ReactNode = null;

            if (showCorrect) {
              bg = "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))";
              border = "#10B981";
              textColor = "#6EE7B7";
              badgeBg = "rgba(16,185,129,0.25)";
              badgeBorder = "#10B98188";
              badgeColor = "#10B981";
              glowShadow = "0 0 20px rgba(16,185,129,0.3)";
              iconEl = <CheckCircle2 size={16} style={{ color: "#10B981", flexShrink: 0 }} />;
            } else if (showWrong) {
              bg = "linear-gradient(135deg, rgba(248,113,113,0.2), rgba(248,113,113,0.08))";
              border = "#F87171";
              textColor = "#FCA5A5";
              badgeBg = "rgba(248,113,113,0.25)";
              badgeBorder = "#F8717188";
              badgeColor = "#F87171";
              glowShadow = "0 0 20px rgba(248,113,113,0.25)";
              iconEl = <XCircle size={16} style={{ color: "#F87171", flexShrink: 0 }} />;
            } else if (isAnswered) {
              bg = "#0a1122";
              border = "rgba(255,255,255,0.04)";
              textColor = "#374151";
              badgeBg = "rgba(255,255,255,0.04)";
              badgeBorder = "rgba(255,255,255,0.06)";
              badgeColor = "#4B5563";
            }

            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.055 }}
                whileTap={!isAnswered ? { scale: 0.97 } : {}}
                onClick={() => handleAnswer(i)}
                disabled={isAnswered}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl w-full text-left"
                style={{
                  background: bg,
                  border: `1.5px solid ${border}`,
                  boxShadow: glowShadow,
                  cursor: isAnswered ? "default" : "pointer",
                  transition: "all 0.25s ease",
                }}
              >
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: badgeBg, border: `1px solid ${badgeBorder}` }}
                >
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.75rem", color: badgeColor }}>
                    {["A", "B", "C", "D"][i]}
                  </span>
                </div>
                <span style={{ flex: 1, fontFamily: "'Inter', sans-serif", fontSize: "0.88rem", color: textColor, transition: "color 0.2s" }}>
                  {answer}
                </span>
                {iconEl}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Timeout banner */}
      <AnimatePresence>
        {timedOut && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-2 rounded-xl"
            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)" }}
          >
            <Clock size={13} style={{ color: "#F87171" }} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.8rem", color: "#FCA5A5" }}>
              Time's up! The correct answer is shown.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback + Next */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-2.5"
          >
            {!timedOut && (
              <div
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
                style={{
                  background: answerState === "correct" ? "rgba(16,185,129,0.1)" : "rgba(248,113,113,0.1)",
                  border: `1px solid ${answerState === "correct" ? "rgba(16,185,129,0.3)" : "rgba(248,113,113,0.3)"}`,
                }}
              >
                {answerState === "correct" ? (
                  <>
                    <CheckCircle2 size={14} style={{ color: "#10B981" }} />
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#6EE7B7" }}>
                      Correct! +{question.points} points earned
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} style={{ color: "#F87171" }} />
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.85rem", color: "#FCA5A5" }}>
                      Wrong answer — 0 points
                    </span>
                  </>
                )}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleNext}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl w-full"
              style={{
                background: "linear-gradient(135deg, #0E47A1, #6D28D9)",
                border: "1px solid rgba(34,211,238,0.3)",
                boxShadow: "0 0 24px rgba(34,211,238,0.2), 0 0 40px rgba(109,40,217,0.2)",
                cursor: "pointer",
              }}
            >
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#fff", letterSpacing: "0.05em" }}>
                {isLast ? "SEE RESULTS" : "NEXT QUESTION"}
              </span>
              <ChevronRight size={16} style={{ color: "#22D3EE" }} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Result Screen ─── */
function GKResultScreen({
  correct, total, points, onRestart, onBack,
}: { correct: number; total: number; points: number; onRestart: () => void; onBack: () => void }) {
  const pct = Math.round((correct / total) * 100);
  const grade =
    pct >= 90 ? { label: "MASTERMIND!", emoji: "🧠", color: "#22D3EE" }
    : pct >= 70 ? { label: "BRILLIANT!", emoji: "⭐", color: "#8B5CF6" }
    : pct >= 50 ? { label: "GOOD JOB!", emoji: "👍", color: "#FBBF24" }
    : { label: "KEEP LEARNING!", emoji: "📚", color: "#F97316" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-5 py-4"
    >
      {/* Grade graphic */}
      <motion.div
        initial={{ scale: 0.4, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
        className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl relative"
        style={{
          background: `linear-gradient(135deg, ${grade.color}30, ${grade.color}10)`,
          border: `2px solid ${grade.color}55`,
          boxShadow: `0 0 48px ${grade.color}30`,
        }}
      >
        {grade.emoji}
        <div className="absolute inset-0 rounded-3xl" style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)` }} />
      </motion.div>

      <div className="flex flex-col items-center gap-1">
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: "1.65rem", color: grade.color, letterSpacing: "0.04em" }}>
          {grade.label}
        </span>
        <span style={{ color: "#6B7280", fontSize: "0.8rem" }}>{correct} of {total} correct</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2.5 w-full">
        {[
          { label: "Correct", value: String(correct), icon: "✅", color: "#10B981" },
          { label: "Accuracy", value: `${pct}%`, icon: "🎯", color: "#22D3EE" },
          { label: "Points", value: `+${points}`, icon: "🪙", color: "#FBBF24" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="flex flex-col items-center rounded-2xl py-4"
            style={{
              background: "linear-gradient(145deg, #0F1C3A, #111827)",
              border: `1px solid ${s.color}33`,
              boxShadow: `0 0 16px ${s.color}12`,
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>{s.icon}</span>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: s.color, marginTop: 2 }}>
              {s.value}
            </span>
            <span style={{ color: "#6B7280", fontSize: "0.6rem" }}>{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Accuracy bar */}
      <div
        className="w-full rounded-2xl px-5 py-4"
        style={{
          background: "linear-gradient(145deg, #0F1C3A, #1A1040)",
          border: "1px solid rgba(34,211,238,0.18)",
          boxShadow: "0 0 24px rgba(34,211,238,0.06)",
        }}
      >
        <div className="flex justify-between mb-2">
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.72rem", color: "#6B7280", letterSpacing: "0.06em" }}>
            ACCURACY
          </span>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.72rem", color: grade.color }}>
            {pct}%
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: 0.3, duration: 0.75, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, #6D28D9, ${grade.color})`, boxShadow: `0 0 10px ${grade.color}55` }}
          />
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Brain size={13} style={{ color: "#22D3EE" }} />
          <span style={{ color: "#CBD5E1", fontSize: "0.78rem" }}>
            {points > 0 ? `${points.toLocaleString()} pts added to your total!` : "Study hard and try again!"}
          </span>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-2.5 w-full">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onRestart}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl w-full"
          style={{
            background: "linear-gradient(135deg, #0E47A1, #6D28D9)",
            border: "1px solid rgba(34,211,238,0.3)",
            boxShadow: "0 0 28px rgba(34,211,238,0.2), 0 0 40px rgba(109,40,217,0.2)",
            cursor: "pointer",
          }}
        >
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#fff", letterSpacing: "0.05em" }}>
            PLAY AGAIN
          </span>
          <span style={{ fontSize: "0.9rem" }}>🧠</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl w-full"
          style={{
            background: "rgba(34,211,238,0.07)",
            border: "1px solid rgba(34,211,238,0.25)",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} style={{ color: "#67E8F9" }} />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#67E8F9", letterSpacing: "0.04em" }}>
            BACK TO HOME
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}
