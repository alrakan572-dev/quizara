import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, CheckCircle2, XCircle, ChevronRight,
  CalendarDays, Flame, Clock, Gift, Shield, Zap, Star, Trophy,
} from "lucide-react";
import confetti from "canvas-confetti";

/* ─── Data ─────────────────────────────────────────────────────────────── */
const DAILY_QUESTIONS = [
  { id: 1,  q: "Which country invented the printing press?",           answers: ["France","China","Germany","England"],    correct: 2, pts: 150, cat: "History"    },
  { id: 2,  q: "What is the hardest natural substance on Earth?",       answers: ["Steel","Quartz","Diamond","Sapphire"],   correct: 2, pts: 200, cat: "Science"    },
  { id: 3,  q: "How many continents are there on Earth?",               answers: ["5","6","7","8"],                         correct: 2, pts: 100, cat: "Geography"  },
  { id: 4,  q: "Who wrote 'Romeo and Juliet'?",                         answers: ["Dickens","Chaucer","Shakespeare","Poe"], correct: 2, pts: 150, cat: "Literature" },
  { id: 5,  q: "What is the largest planet in our solar system?",       answers: ["Earth","Mars","Saturn","Jupiter"],       correct: 3, pts: 150, cat: "Astronomy"  },
  { id: 6,  q: "In which year did the Titanic sink?",                   answers: ["1905","1912","1918","1923"],             correct: 1, pts: 200, cat: "History"    },
  { id: 7,  q: "What gas do plants absorb during photosynthesis?",      answers: ["Oxygen","Nitrogen","CO₂","Helium"],      correct: 2, pts: 150, cat: "Biology"    },
  { id: 8,  q: "How many strings does a standard guitar have?",         answers: ["4","5","6","7"],                         correct: 2, pts: 100, cat: "Music"      },
  { id: 9,  q: "What is the chemical formula for water?",               answers: ["HO","H₂O","H₃O","OH₂"],                 correct: 1, pts: 200, cat: "Chemistry"  },
  { id: 10, q: "Which country has the most natural lakes in the world?",answers: ["Russia","USA","Finland","Canada"],       correct: 3, pts: 250, cat: "Geography"  },
];

const TOTAL_POSSIBLE = DAILY_QUESTIONS.reduce((s, q) => s + q.pts, 0);

const CAT_ICONS: Record<string, string> = {
  History:"📜", Science:"🔬", Geography:"🌍", Literature:"📖",
  Astronomy:"🌌", Biology:"🧬", Music:"🎵", Chemistry:"⚗️", Default:"🧠",
};

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function useCountdown() {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const now   = new Date();
      const reset = new Date();
      reset.setHours(24, 0, 0, 0);
      const diff  = Math.max(0, Math.floor((reset.getTime() - now.getTime()) / 1000));
      setTime({ h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function fireConfetti() {
  const colors = ["#6D28D9","#22D3EE","#FBBF24","#A78BFA","#34D399"];
  confetti({ particleCount: 80, angle: 60,  spread: 70, origin: { x: 0, y: 0.7 }, colors });
  confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
  setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { x: 0.5, y: 0.5 }, colors }), 200);
}

/* ─── Neon Particle Background ──────────────────────────────────────────── */
function NeonParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 3,
    color: i % 3 === 0 ? "#6D28D9" : i % 3 === 1 ? "#22D3EE" : "#FBBF24",
    dur: 3 + Math.random() * 4,
    delay: Math.random() * 3,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: p.color, filter: "blur(1px)" }}
          animate={{ opacity: [0.15, 0.6, 0.15], y: [-6, 6, -6], scale: [1, 1.4, 1] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Props {
  onBack: () => void;
  userPoints: number;
  onPointsUpdate: (pts: number) => void;
}
type Phase = "intro" | "playing" | "done";

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export function DailyChallengePage({ onBack, userPoints, onPointsUpdate }: Props) {
  const [phase, setPhase]               = useState<Phase>("intro");
  const [qIndex, setQIndex]             = useState(0);
  const [selected, setSelected]         = useState<number | null>(null);
  const [answered, setAnswered]         = useState(false);
  const [timedOut, setTimedOut]         = useState(false);
  const [timeLeft, setTimeLeft]         = useState(20);
  const [sessionPts, setSessionPts]     = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak]             = useState(7);          // simulated existing streak
  const [burst, setBurst]               = useState(false);
  const [claimed, setClaimed]           = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdown = useCountdown();

  const q         = DAILY_QUESTIONS[qIndex];
  const progress  = (qIndex / DAILY_QUESTIONS.length) * 100;
  const isLast    = qIndex === DAILY_QUESTIONS.length - 1;

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    if (phase !== "playing" || answered) return;
    setTimeLeft(20);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { stopTimer(); setTimedOut(true); setAnswered(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => stopTimer();
  }, [qIndex, phase, answered, stopTimer]);

  const handleAnswer = (i: number) => {
    if (answered) return;
    stopTimer();
    setSelected(i);
    setAnswered(true);
    setTimedOut(false);
    if (i === q.correct) {
      setSessionPts((p) => p + q.pts);
      setCorrectCount((c) => c + 1);
      onPointsUpdate(userPoints + q.pts);
      setBurst(true);
      setTimeout(() => setBurst(false), 1500);
    }
  };

  const handleNext = () => {
    if (isLast) { setPhase("done"); fireConfetti(); return; }
    setQIndex((i) => i + 1);
    setSelected(null);
    setAnswered(false);
    setTimedOut(false);
    setTimeLeft(20);
  };

  const handleClaim = () => {
    setClaimed(true);
    setStreak((s) => s + 1);
    fireConfetti();
  };

  /* ── Timer color ── */
  const timerPct   = (timeLeft / 20) * 100;
  const timerColor = timeLeft > 12 ? "#22D3EE" : timeLeft > 6 ? "#FBBF24" : "#F87171";

  /* ─── INTRO ────────────────────────────────────────────────────────────── */
  if (phase === "intro") {
    return (
      <IntroScreen
        countdown={countdown}
        totalPts={TOTAL_POSSIBLE}
        streak={streak}
        userPoints={userPoints}
        onStart={() => setPhase("playing")}
        onBack={onBack}
      />
    );
  }

  /* ─── DONE ─────────────────────────────────────────────────────────────── */
  if (phase === "done") {
    return (
      <DoneScreen
        correct={correctCount}
        total={DAILY_QUESTIONS.length}
        pts={sessionPts}
        streak={streak + 1}
        claimed={claimed}
        onClaim={handleClaim}
        onBack={onBack}
      />
    );
  }

  /* ─── PLAYING ───────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-4 pb-2 relative">
      <NeonParticles />
      <div className="relative z-10 flex flex-col gap-4">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background: "rgba(109,40,217,0.15)", border: "1px solid rgba(109,40,217,0.35)", color: "#A78BFA", cursor: "pointer" }}
          >
            <ArrowLeft size={15} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.82rem" }}>Back</span>
          </motion.button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
              <Star size={12} style={{ color: "#FBBF24" }} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "#FBBF24" }}>
                +{sessionPts}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <Flame size={12} style={{ color: "#F87171" }} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "#F87171" }}>
                {streak}d
              </span>
            </div>
          </div>
        </div>

        {/* Challenge header card */}
        <motion.div
          className="rounded-2xl px-4 py-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(109,40,217,0.25) 0%, rgba(15,28,58,0.9) 100%)",
            border: "1px solid rgba(109,40,217,0.4)",
            boxShadow: "0 0 32px rgba(109,40,217,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-25 blur-2xl" style={{ background: "#6D28D9" }} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} style={{ color: "#A78BFA" }} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#F0F4FF", letterSpacing: "0.04em" }}>
                DAILY CHALLENGE
              </span>
            </div>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.7rem", color: "#6B7280" }}>
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2.5 mb-1">
            <div className="flex justify-between mb-1">
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", color: "#9CA3AF" }}>
                Q{qIndex + 1} / {DAILY_QUESTIONS.length}
              </span>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", color: "#A78BFA" }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #6D28D9, #22D3EE)", boxShadow: "0 0 8px rgba(34,211,238,0.4)" }}
              />
            </div>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", color: "#6B7280" }}>
              {CAT_ICONS[q.cat] ?? CAT_ICONS.Default} {q.cat}
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
              <Zap size={10} style={{ color: "#FBBF24" }} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.62rem", color: "#FBBF24" }}>
                +{q.pts} pts
              </span>
            </div>
          </div>
        </motion.div>

        {/* Timer */}
        <motion.div
          animate={{ borderColor: `${timerColor}55`, boxShadow: `0 0 16px ${timerColor}18` }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: "rgba(15,28,58,0.8)",
            border: `1.5px solid ${timerColor}55`,
            backdropFilter: "blur(8px)",
          }}
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
            initial={{ scale: 1.3, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: timerColor, minWidth: 32, textAlign: "right" }}
          >
            {timeLeft}s
          </motion.span>
        </motion.div>

        {/* Question card (glassmorphism) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 32, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -32, scale: 0.97 }}
            transition={{ duration: 0.28, type: "spring", stiffness: 220, damping: 22 }}
            className="rounded-2xl px-5 py-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(15,28,58,0.85) 0%, rgba(26,16,64,0.85) 100%)",
              border: "1.5px solid rgba(109,40,217,0.35)",
              boxShadow: "0 0 40px rgba(109,40,217,0.15), 0 0 80px rgba(34,211,238,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* Corner glows */}
            <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full blur-2xl opacity-30" style={{ background: "#22D3EE" }} />
            <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ background: "#6D28D9" }} />
            <div className="flex items-start gap-3 relative">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
                style={{ background: "linear-gradient(135deg, rgba(109,40,217,0.35), rgba(34,211,238,0.2))", border: "1px solid rgba(109,40,217,0.4)" }}>
                <CalendarDays size={16} style={{ color: "#A78BFA" }} />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.97rem", color: "#F0F4FF", lineHeight: 1.65, margin: 0 }}>
                {q.q}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Points burst */}
        <AnimatePresence>
          {burst && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: 1, y: -20, scale: 1 }}
              exit={{ opacity: 0, y: -44, scale: 0.8 }}
              transition={{ duration: 0.55 }}
              className="flex items-center justify-center pointer-events-none"
              style={{ position: "relative", zIndex: 50 }}
            >
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(34,211,238,0.2))",
                  border: "1.5px solid rgba(16,185,129,0.5)",
                  boxShadow: "0 0 28px rgba(16,185,129,0.4)",
                  backdropFilter: "blur(8px)",
                }}>
                <CheckCircle2 size={15} style={{ color: "#34D399" }} />
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#34D399" }}>
                  +{q.pts} POINTS EARNED!
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer buttons */}
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id + "-ans"}
            className="flex flex-col gap-2.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            {q.answers.map((ans, i) => {
              const isSelected     = selected === i;
              const isCorrectAns   = i === q.correct;
              const showGreen      = answered && isCorrectAns;
              const showRed        = answered && isSelected && !isCorrectAns;
              const isDimmed       = answered && !isCorrectAns && !isSelected;

              let bg     = "linear-gradient(135deg, rgba(15,28,58,0.85), rgba(26,16,64,0.7))";
              let border = "rgba(109,40,217,0.22)";
              let color  = "#CBD5E1";
              let glow   = "none";
              let badgeBg     = "rgba(109,40,217,0.18)";
              let badgeColor  = "#A78BFA";
              let icon: React.ReactNode = null;

              if (showGreen) {
                bg = "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(16,185,129,0.08))";
                border = "#10B981"; color = "#6EE7B7";
                glow = "0 0 24px rgba(16,185,129,0.35)";
                badgeBg = "rgba(16,185,129,0.25)"; badgeColor = "#10B981";
                icon = <CheckCircle2 size={16} style={{ color: "#10B981", flexShrink: 0 }} />;
              } else if (showRed) {
                bg = "linear-gradient(135deg, rgba(248,113,113,0.22), rgba(248,113,113,0.08))";
                border = "#F87171"; color = "#FCA5A5";
                glow = "0 0 24px rgba(248,113,113,0.3)";
                badgeBg = "rgba(248,113,113,0.25)"; badgeColor = "#F87171";
                icon = <XCircle size={16} style={{ color: "#F87171", flexShrink: 0 }} />;
              } else if (isDimmed) {
                bg = "rgba(10,17,34,0.6)"; border = "rgba(255,255,255,0.04)";
                color = "#374151"; badgeBg = "rgba(255,255,255,0.04)"; badgeColor = "#374151";
              }

              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileTap={!answered ? { scale: 0.97 } : {}}
                  onClick={() => handleAnswer(i)}
                  disabled={answered}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl w-full text-left"
                  style={{
                    background: bg,
                    border: `1.5px solid ${border}`,
                    boxShadow: glow,
                    cursor: answered ? "default" : "pointer",
                    backdropFilter: "blur(8px)",
                    transition: "all 0.25s ease",
                  }}
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: badgeBg, border: `1px solid ${badgeColor}44` }}>
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.75rem", color: badgeColor }}>
                      {["A","B","C","D"][i]}
                    </span>
                  </div>
                  <span style={{ flex: 1, fontFamily: "'Inter', sans-serif", fontSize: "0.88rem", color, transition: "color 0.2s" }}>
                    {ans}
                  </span>
                  {icon}
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
                Time's up! Correct answer highlighted.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback + Next */}
        <AnimatePresence>
          {answered && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-2.5"
            >
              {!timedOut && (
                <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
                  style={{
                    background: selected === q.correct ? "rgba(16,185,129,0.1)" : "rgba(248,113,113,0.1)",
                    border: `1px solid ${selected === q.correct ? "rgba(16,185,129,0.35)" : "rgba(248,113,113,0.35)"}`,
                    backdropFilter: "blur(8px)",
                  }}>
                  {selected === q.correct
                    ? <><CheckCircle2 size={14} style={{ color: "#10B981" }} /><span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#6EE7B7" }}>Correct! +{q.pts} points</span></>
                    : <><XCircle size={14} style={{ color: "#F87171" }} /><span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.85rem", color: "#FCA5A5" }}>Wrong answer — 0 points</span></>
                  }
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl w-full"
                style={{
                  background: "linear-gradient(135deg, #4C1D95, #6D28D9, #0E47A1)",
                  border: "1px solid rgba(167,139,250,0.4)",
                  boxShadow: "0 0 28px rgba(109,40,217,0.45), 0 0 56px rgba(34,211,238,0.12)",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#fff", letterSpacing: "0.05em" }}>
                  {isLast ? "COMPLETE CHALLENGE" : "NEXT QUESTION"}
                </span>
                <ChevronRight size={16} style={{ color: "#22D3EE" }} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

/* ─── Intro Screen ──────────────────────────────────────────────────────── */
function IntroScreen({ countdown, totalPts, streak, userPoints, onStart, onBack }: {
  countdown: { h: number; m: number; s: number };
  totalPts: number; streak: number; userPoints: number;
  onStart: () => void; onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 pb-2 relative">
      <NeonParticles />
      <div className="relative z-10 flex flex-col gap-4">

        {/* Back */}
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background: "rgba(109,40,217,0.15)", border: "1px solid rgba(109,40,217,0.35)", color: "#A78BFA", cursor: "pointer" }}
          >
            <ArrowLeft size={15} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.82rem" }}>Back</span>
          </motion.button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)" }}>
            <span style={{ fontSize: "0.8rem" }}>🪙</span>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#FBBF24" }}>
              {userPoints.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl px-5 py-6 relative overflow-hidden flex flex-col items-center gap-3"
          style={{
            background: "linear-gradient(145deg, rgba(26,16,64,0.95) 0%, rgba(15,28,58,0.95) 100%)",
            border: "1.5px solid rgba(109,40,217,0.45)",
            boxShadow: "0 0 60px rgba(109,40,217,0.25), 0 0 100px rgba(34,211,238,0.08), inset 0 1px 0 rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ background: "#6D28D9" }} />
          <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-20" style={{ background: "#22D3EE" }} />

          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl relative"
            style={{
              background: "linear-gradient(135deg, rgba(109,40,217,0.5), rgba(34,211,238,0.3))",
              border: "2px solid rgba(167,139,250,0.5)",
              boxShadow: "0 0 32px rgba(109,40,217,0.5), 0 0 64px rgba(34,211,238,0.15)",
            }}
          >
            📅
          </motion.div>

          <div className="flex flex-col items-center gap-0.5 relative">
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: "1.4rem", color: "#F0F4FF", letterSpacing: "0.04em" }}>
              DAILY CHALLENGE
            </span>
            <span style={{ color: "#6B7280", fontSize: "0.75rem" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
          </div>

          {/* Reward */}
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl relative"
            style={{
              background: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(217,119,6,0.1))",
              border: "1px solid rgba(251,191,36,0.4)",
              boxShadow: "0 0 20px rgba(251,191,36,0.15)",
            }}>
            <Gift size={16} style={{ color: "#FBBF24" }} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#FBBF24" }}>
              TODAY'S REWARD: {totalPts.toLocaleString()} PTS
            </span>
          </div>

          {/* Countdown to reset */}
          <div className="w-full rounded-2xl px-4 py-3 flex flex-col items-center gap-1.5 relative"
            style={{ background: "rgba(15,28,58,0.7)", border: "1px solid rgba(34,211,238,0.2)" }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", color: "#6B7280", letterSpacing: "0.1em" }}>
              RESETS IN
            </span>
            <div className="flex items-center gap-2">
              {[
                { label: "HH", value: countdown.h },
                { label: "MM", value: countdown.m },
                { label: "SS", value: countdown.s },
              ].map((seg, i) => (
                <div key={seg.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "#22D3EE", lineHeight: 1 }}>
                      {pad(seg.value)}
                    </span>
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.55rem", color: "#4B5563", letterSpacing: "0.08em" }}>
                      {seg.label}
                    </span>
                  </div>
                  {i < 2 && <span style={{ color: "#22D3EE", fontSize: "1.2rem", fontWeight: 800, marginBottom: 8 }}>:</span>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Streak + stats */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: <Flame size={16} style={{ color: "#F87171" }} />, label: "Streak", value: `${streak} Days`, color: "#F87171" },
            { icon: <Shield size={16} style={{ color: "#22D3EE" }} />, label: "Questions", value: "10 Today", color: "#22D3EE" },
            { icon: <Trophy size={16} style={{ color: "#FBBF24" }} />, label: "Max Earn", value: `${totalPts} pts`, color: "#FBBF24" },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl"
              style={{
                background: "linear-gradient(145deg, rgba(15,28,58,0.85), rgba(26,16,64,0.7))",
                border: `1px solid ${s.color}25`,
                boxShadow: `0 0 16px ${s.color}10`,
                backdropFilter: "blur(8px)",
              }}
            >
              {s.icon}
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: "0.9rem", color: s.color }}>
                {s.value}
              </span>
              <span style={{ color: "#6B7280", fontSize: "0.6rem" }}>{s.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Start button */}
        <motion.button
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="flex items-center justify-center gap-2.5 py-4 rounded-2xl w-full"
          style={{
            background: "linear-gradient(135deg, #4C1D95, #6D28D9, #0E47A1)",
            border: "1.5px solid rgba(167,139,250,0.45)",
            boxShadow: "0 0 32px rgba(109,40,217,0.5), 0 0 60px rgba(34,211,238,0.15)",
            cursor: "pointer",
          }}
        >
          <CalendarDays size={18} style={{ color: "#22D3EE" }} />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: "1.05rem", color: "#fff", letterSpacing: "0.06em" }}>
            START TODAY'S CHALLENGE
          </span>
        </motion.button>

      </div>
    </div>
  );
}

/* ─── Done Screen ───────────────────────────────────────────────────────── */
function DoneScreen({ correct, total, pts, streak, claimed, onClaim, onBack }: {
  correct: number; total: number; pts: number; streak: number;
  claimed: boolean; onClaim: () => void; onBack: () => void;
}) {
  const pct   = Math.round((correct / total) * 100);
  const grade =
    pct >= 90 ? { label: "FLAWLESS!", emoji: "🏆", color: "#FBBF24" }
    : pct >= 70 ? { label: "BRILLIANT!", emoji: "⭐", color: "#22D3EE" }
    : pct >= 50 ? { label: "GREAT JOB!", emoji: "👍", color: "#A78BFA" }
    : { label: "KEEP GOING!", emoji: "💪", color: "#F97316" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-5 pb-4 relative"
    >
      <NeonParticles />
      <div className="relative z-10 w-full flex flex-col items-center gap-5">

        {/* Grade trophy */}
        <motion.div
          initial={{ scale: 0.4, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 14 }}
          className="w-28 h-28 rounded-3xl flex items-center justify-center relative"
          style={{
            background: `linear-gradient(135deg, ${grade.color}35, ${grade.color}12)`,
            border: `2px solid ${grade.color}55`,
            boxShadow: `0 0 60px ${grade.color}35, inset 0 1px 0 rgba(255,255,255,0.1)`,
          }}
        >
          <span style={{ fontSize: "3.2rem" }}>{grade.emoji}</span>
          {/* Glow ring */}
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-3xl"
            style={{ border: `2px solid ${grade.color}`, opacity: 0.35 }}
          />
        </motion.div>

        <div className="flex flex-col items-center gap-1">
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: "1.7rem", color: grade.color, letterSpacing: "0.04em" }}>
            {grade.label}
          </span>
          <span style={{ color: "#6B7280", fontSize: "0.8rem" }}>{correct} of {total} correct</span>
        </div>

        {/* Completed badge */}
        {claimed && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(251,191,36,0.3), rgba(217,119,6,0.15))",
              border: "1.5px solid rgba(251,191,36,0.6)",
              boxShadow: "0 0 32px rgba(251,191,36,0.3)",
            }}
          >
            <Shield size={16} style={{ color: "#FBBF24" }} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: "0.9rem", color: "#FBBF24", letterSpacing: "0.06em" }}>
              DAILY REWARD CLAIMED ✓
            </span>
          </motion.div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          {[
            { label: "Points Earned",    value: `+${pts.toLocaleString()}`, icon: "🪙", color: "#FBBF24", sub: "today" },
            { label: "Accuracy",         value: `${pct}%`,                  icon: "🎯", color: "#22D3EE", sub: "correct" },
            { label: "Daily Streak",     value: `${streak} Days`,           icon: "🔥", color: "#F87171", sub: "in a row" },
            { label: "Total Correct",    value: `${correct}/${total}`,      icon: "✅", color: "#34D399", sub: "questions" },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="flex flex-col items-center rounded-2xl py-4 px-3"
              style={{
                background: "linear-gradient(145deg, rgba(15,28,58,0.9), rgba(26,16,64,0.8))",
                border: `1px solid ${s.color}30`,
                boxShadow: `0 0 20px ${s.color}10`,
                backdropFilter: "blur(12px)",
              }}
            >
              <span style={{ fontSize: "1.4rem" }}>{s.icon}</span>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: s.color, marginTop: 4 }}>
                {s.value}
              </span>
              <span style={{ color: "#9CA3AF", fontSize: "0.65rem" }}>{s.label}</span>
              <span style={{ color: "#4B5563", fontSize: "0.6rem" }}>{s.sub}</span>
            </motion.div>
          ))}
        </div>

        {/* Accuracy bar */}
        <div className="w-full rounded-2xl px-5 py-4"
          style={{
            background: "linear-gradient(145deg, rgba(15,28,58,0.9), rgba(26,16,64,0.8))",
            border: "1px solid rgba(109,40,217,0.3)",
            backdropFilter: "blur(12px)",
          }}>
          <div className="flex justify-between mb-2">
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.68rem", color: "#6B7280", letterSpacing: "0.08em" }}>ACCURACY</span>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.68rem", color: grade.color }}>{pct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, #6D28D9, ${grade.color})`, boxShadow: `0 0 12px ${grade.color}55` }}
            />
          </div>
          <div className="flex items-center gap-2 mt-3 pt-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <CalendarDays size={12} style={{ color: "#A78BFA" }} />
            <span style={{ color: "#9CA3AF", fontSize: "0.75rem" }}>
              Come back tomorrow for the next challenge!
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          {!claimed && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onClaim}
              className="flex items-center justify-center gap-2.5 py-4 rounded-2xl w-full"
              style={{
                background: "linear-gradient(135deg, #D97706, #FBBF24, #F59E0B)",
                border: "1.5px solid rgba(251,191,36,0.5)",
                boxShadow: "0 0 36px rgba(251,191,36,0.45), 0 0 60px rgba(251,191,36,0.15)",
                cursor: "pointer",
              }}
            >
              <Gift size={18} style={{ color: "#111827" }} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: "1.05rem", color: "#111827", letterSpacing: "0.06em" }}>
                CLAIM REWARD — {pts.toLocaleString()} PTS
              </span>
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onBack}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl w-full"
            style={{
              background: "rgba(109,40,217,0.12)",
              border: "1px solid rgba(109,40,217,0.35)",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={15} style={{ color: "#A78BFA" }} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#A78BFA", letterSpacing: "0.04em" }}>
              BACK TO HOME
            </span>
          </motion.button>
        </div>

      </div>
    </motion.div>
  );
}
