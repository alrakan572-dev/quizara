import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, CheckCircle2, XCircle, ChevronRight,
  Zap, Flame, Trophy, Clock, Star, TrendingUp, Shield,
  Timer,
} from "lucide-react";

/* ─── Questions ─────────────────────────────────────────────────────────── */
const QUESTIONS = [
  { id:1,  q:"What is 15 × 8?",                                          answers:["110","120","125","130"],         correct:1, diff:"EASY"   },
  { id:2,  q:"Which gas makes up most of Earth's atmosphere?",            answers:["Oxygen","CO₂","Nitrogen","Argon"],correct:2, diff:"EASY"   },
  { id:3,  q:"How many sides does a hexagon have?",                       answers:["5","6","7","8"],                  correct:1, diff:"EASY"   },
  { id:4,  q:"What is the square root of 144?",                          answers:["11","12","13","14"],              correct:1, diff:"MEDIUM" },
  { id:5,  q:"Which planet is known as the Red Planet?",                  answers:["Venus","Jupiter","Mars","Saturn"],correct:2, diff:"EASY"   },
  { id:6,  q:"What is the powerhouse of the cell?",                       answers:["Nucleus","Ribosome","Mitochondria","Vacuole"], correct:2, diff:"MEDIUM" },
  { id:7,  q:"How many hours are in a week?",                             answers:["148","158","168","178"],          correct:2, diff:"MEDIUM" },
  { id:8,  q:"Which element has the symbol 'Fe'?",                        answers:["Fluorine","Francium","Iron","Fermium"], correct:2, diff:"HARD" },
  { id:9,  q:"What is the value of π (Pi) to 2 decimal places?",         answers:["3.12","3.14","3.16","3.18"],      correct:1, diff:"MEDIUM" },
  { id:10, q:"In binary, what does 1010 equal in decimal?",               answers:["8","9","10","12"],                correct:2, diff:"HARD"   },
];

/* ─── Speed tier config ─────────────────────────────────────────────────── */
const SPEED_TIERS = [
  { maxTime:2,  pts:300, label:"⚡ LIGHTNING!", color:"#22D3EE", glow:"rgba(34,211,238,0.5)"  },
  { maxTime:4,  pts:250, label:"🔥 BLAZING!",   color:"#F97316", glow:"rgba(249,115,22,0.45)"  },
  { maxTime:6,  pts:200, label:"💨 FAST!",       color:"#A78BFA", glow:"rgba(167,139,250,0.4)"  },
  { maxTime:8,  pts:150, label:"✅ QUICK",        color:"#34D399", glow:"rgba(52,211,153,0.35)"  },
  { maxTime:10, pts:50,  label:"🐢 SLOW",         color:"#9CA3AF", glow:"rgba(156,163,175,0.25)" },
];

function getTier(elapsed: number) {
  return SPEED_TIERS.find((t) => elapsed <= t.maxTime) ?? SPEED_TIERS[SPEED_TIERS.length - 1];
}

const DIFF_META: Record<string, { color: string }> = {
  EASY:   { color:"#34D399" },
  MEDIUM: { color:"#FBBF24" },
  HARD:   { color:"#F87171" },
};

/* ─── Neon particles ────────────────────────────────────────────────────── */
function NeonParticles({ count = 22 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id:i, x:Math.random()*100, y:Math.random()*100,
    size:1.5+Math.random()*3,
    color: i%4===0 ? "#6D28D9" : i%4===1 ? "#22D3EE" : i%4===2 ? "#F97316" : "#FBBF24",
    dur:2.5+Math.random()*4, delay:Math.random()*3,
  }));
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex:0 }}>
      {particles.map((p) => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size, background:p.color, filter:"blur(1px)" }}
          animate={{ opacity:[0.1,0.55,0.1], y:[-8,8,-8], scale:[1,1.5,1] }}
          transition={{ duration:p.dur, delay:p.delay, repeat:Infinity, ease:"easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Lightning flash overlay ───────────────────────────────────────────── */
function LightningFlash({ trigger }: { trigger: boolean }) {
  return (
    <AnimatePresence>
      {trigger && (
        <motion.div
          key={Math.random()}
          initial={{ opacity:0.6 }} animate={{ opacity:0 }}
          transition={{ duration:0.35 }}
          className="fixed inset-0 pointer-events-none"
          style={{ background:"radial-gradient(ellipse at center, rgba(34,211,238,0.18) 0%, transparent 70%)", zIndex:100 }}
        />
      )}
    </AnimatePresence>
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
export function FastestPage({ onBack, userPoints, onPointsUpdate }: Props) {
  const BEST_RECORD = 1850; // simulated best score

  const [phase, setPhase]               = useState<Phase>("intro");
  const [qIndex, setQIndex]             = useState(0);
  const [timeLeft, setTimeLeft]         = useState(10);
  const [elapsed, setElapsed]           = useState(0);
  const [selected, setSelected]         = useState<number | null>(null);
  const [answered, setAnswered]         = useState(false);
  const [timedOut, setTimedOut]         = useState(false);
  const [sessionPts, setSessionPts]     = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo]               = useState(0);
  const [totalTime, setTotalTime]       = useState(0);   // ms spent answering
  const [burstTier, setBurstTier]       = useState<typeof SPEED_TIERS[0] | null>(null);
  const [flash, setFlash]               = useState(false);
  const [comboBurst, setComboBurst]     = useState(false);

  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef   = useRef<number>(0);                  // question start timestamp

  const q      = QUESTIONS[qIndex];
  const isLast = qIndex === QUESTIONS.length - 1;
  const timerPct = (timeLeft / 10) * 100;
  const timerColor = timeLeft > 6 ? "#22D3EE" : timeLeft > 3 ? "#F97316" : "#F87171";

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const handleTimeout = useCallback(() => {
    stopTimer();
    setTimedOut(true);
    setAnswered(true);
    setCombo(0);
  }, [stopTimer]);

  /* start timer on new question */
  useEffect(() => {
    if (phase !== "playing" || answered) return;
    setTimeLeft(10);
    setElapsed(0);
    startRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const el = (Date.now() - startRef.current) / 1000;
      setElapsed(el);
      setTimeLeft((t) => {
        if (t <= 1) { handleTimeout(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => stopTimer();
  }, [qIndex, phase, answered, handleTimeout, stopTimer]);

  const handleAnswer = (i: number) => {
    if (answered) return;
    stopTimer();
    const el = (Date.now() - startRef.current) / 1000;
    setSelected(i);
    setAnswered(true);
    setTimedOut(false);
    setTotalTime((t) => t + Math.round(el * 1000));

    if (i === q.correct) {
      const tier = getTier(el);
      const isLightning = tier.pts >= 300;
      setCombo((c) => {
        const next = c + 1;
        if (next >= 3) setComboBurst(true);
        setTimeout(() => setComboBurst(false), 1200);
        return next;
      });
      const bonus = combo >= 2 ? 50 : 0;           // combo bonus
      const earned = tier.pts + bonus;
      setSessionPts((p) => p + earned);
      setCorrectCount((c) => c + 1);
      onPointsUpdate(userPoints + earned);
      setBurstTier(tier);
      setTimeout(() => setBurstTier(null), 1400);
      if (isLightning) { setFlash(true); setTimeout(() => setFlash(false), 400); }
    } else {
      setCombo(0);
    }
  };

  const handleNext = () => {
    if (isLast) { setPhase("done"); return; }
    setQIndex((i) => i + 1);
    setSelected(null);
    setAnswered(false);
    setTimedOut(false);
    setTimeLeft(10);
  };

  /* ─── INTRO ─────────────────────────────────────────────────────────── */
  if (phase === "intro") {
    return <IntroScreen bestRecord={BEST_RECORD} userPoints={userPoints} onStart={() => setPhase("playing")} onBack={onBack} />;
  }

  /* ─── DONE ──────────────────────────────────────────────────────────── */
  if (phase === "done") {
    return (
      <DoneScreen
        correct={correctCount} total={QUESTIONS.length}
        pts={sessionPts} totalTimeMs={totalTime}
        bestRecord={BEST_RECORD} isNewRecord={sessionPts > BEST_RECORD}
        onRestart={() => {
          setPhase("playing"); setQIndex(0); setSelected(null); setAnswered(false);
          setTimedOut(false); setTimeLeft(10); setSessionPts(0);
          setCorrectCount(0); setCombo(0); setTotalTime(0);
        }}
        onBack={onBack}
      />
    );
  }

  /* ─── PLAYING ───────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-3.5 pb-2" style={{ position:"relative" }}>
      <NeonParticles />
      <LightningFlash trigger={flash} />
      <div className="relative flex flex-col gap-3.5" style={{ zIndex:1 }}>

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <motion.button whileTap={{ scale:0.92 }} onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background:"rgba(249,115,22,0.12)", border:"1px solid rgba(249,115,22,0.35)", color:"#FB923C", cursor:"pointer" }}>
            <ArrowLeft size={15} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.82rem" }}>Back</span>
          </motion.button>

          <div className="flex items-center gap-2">
            {/* combo badge */}
            <AnimatePresence>
              {combo >= 2 && (
                <motion.div
                  initial={{ scale:0.5, opacity:0 }} animate={{ scale:1, opacity:1 }}
                  exit={{ scale:0.5, opacity:0 }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
                  style={{ background:"rgba(249,115,22,0.15)", border:"1px solid rgba(249,115,22,0.4)",
                    boxShadow:`0 0 12px rgba(249,115,22,0.3)` }}>
                  <Flame size={13} style={{ color:"#F97316" }} />
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"0.8rem", color:"#FB923C" }}>
                    ×{combo} COMBO
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)" }}>
              <Star size={12} style={{ color:"#FBBF24" }} />
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.78rem", color:"#FBBF24" }}>
                +{sessionPts}
              </span>
            </div>
          </div>
        </div>

        {/* Mode header */}
        <motion.div
          className="rounded-2xl px-4 py-3 relative overflow-hidden"
          style={{
            background:"linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(15,28,58,0.92) 100%)",
            border:"1px solid rgba(249,115,22,0.4)",
            boxShadow:"0 0 28px rgba(249,115,22,0.18), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter:"blur(12px)",
          }}
        >
          <div className="absolute -top-8 -right-6 w-24 h-24 rounded-full blur-2xl opacity-25" style={{ background:"#F97316" }} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} style={{ color:"#F97316" }} />
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.9rem", color:"#FFF7ED", letterSpacing:"0.04em" }}>
                FASTEST MODE
              </span>
            </div>
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.68rem", color:"#DIFF_META", letterSpacing:"0.06em" }}>
              <span style={{ color: DIFF_META[q.diff].color, fontWeight:700 }}>{q.diff}</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5">
            <div className="flex justify-between mb-1">
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.62rem", color:"#9CA3AF" }}>
                Q{qIndex+1} / {QUESTIONS.length}
              </span>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.62rem", color:"#F97316" }}>
                {Math.round(((qIndex)/QUESTIONS.length)*100)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background:"rgba(255,255,255,0.07)" }}>
              <motion.div
                animate={{ width:`${((qIndex)/QUESTIONS.length)*100}%` }}
                transition={{ duration:0.4 }}
                className="h-full rounded-full"
                style={{ background:"linear-gradient(90deg, #F97316, #22D3EE)", boxShadow:"0 0 8px rgba(249,115,22,0.4)" }}
              />
            </div>
          </div>

          {/* Speed tier guide */}
          <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth:"none" }}>
            {SPEED_TIERS.map((t) => (
              <div key={t.label} className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-lg"
                style={{ background:`${t.glow.replace("0.5","0.1")}`, border:`1px solid ${t.color}33` }}>
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.55rem", color:t.color }}>
                  ≤{t.maxTime}s={t.pts}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Timer bar */}
        <motion.div
          animate={{ borderColor:`${timerColor}66`, boxShadow:`0 0 20px ${timerColor}22` }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background:"rgba(10,15,30,0.85)",
            border:`2px solid ${timerColor}66`,
            backdropFilter:"blur(8px)",
          }}
        >
          <Timer size={15} style={{ color:timerColor }} />
          <div className="flex-1 h-2 rounded-full" style={{ background:"rgba(255,255,255,0.07)" }}>
            <motion.div
              animate={{ width:`${timerPct}%` }}
              transition={{ duration:0.9, ease:"linear" }}
              className="h-full rounded-full"
              style={{ background:timerColor, boxShadow:`0 0 10px ${timerColor}99` }}
            />
          </div>
          <motion.span
            key={timeLeft}
            initial={{ scale:1.4, opacity:0.5 }}
            animate={{ scale:1, opacity:1 }}
            style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.3rem", color:timerColor, minWidth:32, textAlign:"right" }}
          >
            {timeLeft}s
          </motion.span>

          {/* Elapsed chip */}
          <div className="px-2 py-0.5 rounded-lg"
            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.65rem", color:"#6B7280" }}>
              {elapsed.toFixed(1)}s
            </span>
          </div>
        </motion.div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity:0, x:36, scale:0.96 }}
            animate={{ opacity:1, x:0, scale:1 }}
            exit={{ opacity:0, x:-36, scale:0.96 }}
            transition={{ duration:0.25, type:"spring", stiffness:240, damping:22 }}
            className="rounded-2xl px-5 py-5 relative overflow-hidden"
            style={{
              background:"linear-gradient(145deg, rgba(10,15,30,0.9) 0%, rgba(26,16,64,0.85) 100%)",
              border:"1.5px solid rgba(249,115,22,0.28)",
              boxShadow:"0 0 40px rgba(249,115,22,0.12), 0 0 60px rgba(109,40,217,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
              backdropFilter:"blur(16px)",
            }}
          >
            <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full blur-3xl opacity-25" style={{ background:"#F97316" }} />
            <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-20" style={{ background:"#6D28D9" }} />
            <div className="flex items-start gap-3 relative">
              <motion.div
                animate={{ boxShadow:["0 0 8px #F9731666","0 0 20px #F9731688","0 0 8px #F9731666"] }}
                transition={{ duration:1.5, repeat:Infinity }}
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
                style={{ background:"linear-gradient(135deg, rgba(249,115,22,0.3), rgba(109,40,217,0.25))", border:"1px solid rgba(249,115,22,0.45)" }}>
                <Zap size={17} style={{ color:"#F97316" }} />
              </motion.div>
              <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.97rem", color:"#FFF7ED", lineHeight:1.65, margin:0 }}>
                {q.q}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Speed burst animation */}
        <AnimatePresence>
          {burstTier && (
            <motion.div
              initial={{ opacity:0, y:0, scale:0.55 }}
              animate={{ opacity:1, y:-24, scale:1 }}
              exit={{ opacity:0, y:-52, scale:0.8 }}
              transition={{ duration:0.5 }}
              className="flex items-center justify-center pointer-events-none"
              style={{ position:"relative", zIndex:50 }}
            >
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl"
                style={{
                  background:`linear-gradient(135deg, ${burstTier.glow}, rgba(15,28,58,0.7))`,
                  border:`1.5px solid ${burstTier.color}88`,
                  boxShadow:`0 0 32px ${burstTier.glow}`,
                  backdropFilter:"blur(8px)",
                }}>
                <Zap size={16} style={{ color:burstTier.color }} />
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.05rem", color:burstTier.color }}>
                  {burstTier.label} +{burstTier.pts}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Combo burst */}
        <AnimatePresence>
          {comboBurst && (
            <motion.div
              initial={{ opacity:0, scale:0.5 }}
              animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0, scale:0.7 }}
              transition={{ duration:0.4 }}
              className="flex items-center justify-center pointer-events-none"
              style={{ position:"relative", zIndex:50, marginTop:-8 }}
            >
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl"
                style={{
                  background:"rgba(249,115,22,0.2)",
                  border:"1px solid rgba(249,115,22,0.5)",
                  boxShadow:"0 0 20px rgba(249,115,22,0.4)",
                }}>
                <Flame size={14} style={{ color:"#F97316" }} />
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"0.85rem", color:"#FB923C" }}>
                  🔥 COMBO ×{combo}! +50 BONUS
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answers */}
        <AnimatePresence mode="wait">
          <motion.div key={q.id+"-ans"} className="flex flex-col gap-2.5"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            {q.answers.map((ans, i) => {
              const isSelected   = selected === i;
              const isCorrectAns = i === q.correct;
              const showGreen    = answered && isCorrectAns;
              const showRed      = answered && isSelected && !isCorrectAns;
              const isDimmed     = answered && !isCorrectAns && !isSelected;

              const tier = (answered && isSelected && isCorrectAns)
                ? getTier((Date.now() - startRef.current) / 1000)
                : null;

              let bg     = "linear-gradient(135deg, rgba(10,15,30,0.88), rgba(26,16,64,0.72))";
              let border = "rgba(249,115,22,0.2)";
              let color  = "#CBD5E1";
              let glow   = "none";
              let badgeBg    = "rgba(249,115,22,0.15)";
              let badgeColor = "#F97316";
              let icon: React.ReactNode = null;

              if (showGreen) {
                bg="linear-gradient(135deg, rgba(16,185,129,0.22), rgba(16,185,129,0.08))";
                border="#10B981"; color="#6EE7B7";
                glow=`0 0 28px rgba(16,185,129,0.4)`;
                badgeBg="rgba(16,185,129,0.25)"; badgeColor="#10B981";
                icon=<CheckCircle2 size={16} style={{ color:"#10B981", flexShrink:0 }} />;
              } else if (showRed) {
                bg="linear-gradient(135deg, rgba(248,113,113,0.22), rgba(248,113,113,0.08))";
                border="#F87171"; color="#FCA5A5";
                glow="0 0 24px rgba(248,113,113,0.35)";
                badgeBg="rgba(248,113,113,0.25)"; badgeColor="#F87171";
                icon=<XCircle size={16} style={{ color:"#F87171", flexShrink:0 }} />;
              } else if (isDimmed) {
                bg="rgba(8,12,24,0.7)"; border="rgba(255,255,255,0.04)";
                color="#2D3748"; badgeBg="rgba(255,255,255,0.04)"; badgeColor="#374151";
              }

              return (
                <motion.button
                  key={i}
                  initial={{ opacity:0, x:-8 }}
                  animate={{ opacity:1, x:0 }}
                  transition={{ delay:i*0.055 }}
                  whileTap={!answered ? { scale:0.97 } : {}}
                  onClick={() => handleAnswer(i)}
                  disabled={answered}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl w-full text-left"
                  style={{ background:bg, border:`1.5px solid ${border}`, boxShadow:glow,
                    cursor:answered?"default":"pointer", backdropFilter:"blur(8px)", transition:"all 0.22s ease" }}
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background:badgeBg, border:`1px solid ${badgeColor}44` }}>
                    <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.75rem", color:badgeColor }}>
                      {["A","B","C","D"][i]}
                    </span>
                  </div>
                  <span style={{ flex:1, fontFamily:"'Inter', sans-serif", fontSize:"0.88rem", color, transition:"color 0.2s" }}>
                    {ans}
                  </span>
                  {icon}
                  {showGreen && tier && (
                    <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.68rem",
                      color:tier.color, flexShrink:0 }}>
                      +{tier.pts}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Timeout banner */}
        <AnimatePresence>
          {timedOut && (
            <motion.div
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="flex items-center justify-center gap-2 py-2 rounded-xl"
              style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)" }}>
              <Clock size={13} style={{ color:"#F87171" }} />
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.8rem", color:"#FCA5A5" }}>
                Too slow! Combo reset. Correct answer shown.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback + Next */}
        <AnimatePresence>
          {answered && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="flex flex-col gap-2.5">
              {!timedOut && (
                <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
                  style={{
                    background:selected===q.correct ? "rgba(16,185,129,0.1)" : "rgba(248,113,113,0.1)",
                    border:`1px solid ${selected===q.correct ? "rgba(16,185,129,0.35)" : "rgba(248,113,113,0.35)"}`,
                    backdropFilter:"blur(8px)",
                  }}>
                  {selected===q.correct
                    ? <><CheckCircle2 size={14} style={{ color:"#10B981" }} />
                        <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.85rem", color:"#6EE7B7" }}>
                          Correct! Speed bonus: {getTier(elapsed).pts} pts
                        </span></>
                    : <><XCircle size={14} style={{ color:"#F87171" }} />
                        <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.85rem", color:"#FCA5A5" }}>
                          Wrong! 0 points. Combo lost.
                        </span></>
                  }
                </div>
              )}

              <motion.button
                whileTap={{ scale:0.97 }} onClick={handleNext}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl w-full"
                style={{
                  background:"linear-gradient(135deg, #7C2D12, #EA580C, #6D28D9)",
                  border:"1px solid rgba(249,115,22,0.45)",
                  boxShadow:"0 0 32px rgba(249,115,22,0.35), 0 0 60px rgba(109,40,217,0.2)",
                  cursor:"pointer",
                }}>
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"1rem", color:"#fff", letterSpacing:"0.05em" }}>
                  {isLast ? "SEE RESULTS" : "NEXT QUESTION"}
                </span>
                <ChevronRight size={16} style={{ color:"#FBBF24" }} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

/* ─── Intro screen ──────────────────────────────────────────────────────── */
function IntroScreen({ bestRecord, userPoints, onStart, onBack }: {
  bestRecord: number; userPoints: number; onStart: () => void; onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 pb-2 relative">
      <NeonParticles />
      <div className="relative z-10 flex flex-col gap-4">

        <div className="flex items-center justify-between">
          <motion.button whileTap={{ scale:0.92 }} onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background:"rgba(249,115,22,0.12)", border:"1px solid rgba(249,115,22,0.35)", color:"#FB923C", cursor:"pointer" }}>
            <ArrowLeft size={15} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.82rem" }}>Back</span>
          </motion.button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)" }}>
            <span style={{ fontSize:"0.8rem" }}>🪙</span>
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.82rem", color:"#FBBF24" }}>
              {userPoints.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}
          className="rounded-3xl px-5 py-6 relative overflow-hidden flex flex-col items-center gap-4"
          style={{
            background:"linear-gradient(145deg, rgba(30,10,5,0.95) 0%, rgba(10,15,30,0.95) 100%)",
            border:"1.5px solid rgba(249,115,22,0.45)",
            boxShadow:"0 0 60px rgba(249,115,22,0.25), 0 0 100px rgba(109,40,217,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
            backdropFilter:"blur(20px)",
          }}
        >
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-25" style={{ background:"#F97316" }} />
          <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-20" style={{ background:"#6D28D9" }} />

          {/* Animated bolt */}
          <motion.div
            animate={{
              boxShadow:["0 0 24px #F9731666","0 0 48px #F9731688","0 0 24px #F9731666"],
              scale:[1,1.06,1],
            }}
            transition={{ duration:1.8, repeat:Infinity, ease:"easeInOut" }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl relative"
            style={{
              background:"linear-gradient(135deg, rgba(249,115,22,0.45), rgba(109,40,217,0.35))",
              border:"2px solid rgba(249,115,22,0.55)",
            }}
          >
            ⚡
          </motion.div>

          <div className="flex flex-col items-center gap-0.5 relative">
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.45rem", color:"#FFF7ED", letterSpacing:"0.04em" }}>
              FASTEST MODE
            </span>
            <span style={{ color:"#9CA3AF", fontSize:"0.72rem" }}>Speed is everything. Think fast, earn more.</span>
          </div>

          {/* Best record */}
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl"
            style={{
              background:"linear-gradient(135deg, rgba(251,191,36,0.18), rgba(217,119,6,0.08))",
              border:"1px solid rgba(251,191,36,0.38)",
              boxShadow:"0 0 18px rgba(251,191,36,0.12)",
            }}>
            <Trophy size={15} style={{ color:"#FBBF24" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.9rem", color:"#FBBF24" }}>
              BEST RECORD: {bestRecord.toLocaleString()} PTS
            </span>
          </div>
        </motion.div>

        {/* Speed tier cards */}
        <div className="grid grid-cols-1 gap-2">
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#6B7280", letterSpacing:"0.1em" }}>
            SPEED SCORING
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {SPEED_TIERS.map((t) => (
              <motion.div key={t.label}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                className="flex flex-col items-center py-3 rounded-xl gap-1"
                style={{
                  background:"linear-gradient(145deg, rgba(10,15,30,0.88), rgba(26,16,64,0.7))",
                  border:`1px solid ${t.color}30`,
                  boxShadow:`0 0 12px ${t.color}10`,
                  backdropFilter:"blur(8px)",
                }}>
                <span style={{ fontSize:"0.95rem" }}>{t.label.split(" ")[0]}</span>
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"0.9rem", color:t.color }}>
                  {t.pts}
                </span>
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.55rem", color:"#6B7280" }}>
                  ≤{t.maxTime}s
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="flex flex-col gap-2">
          {[
            { icon:<Zap size={14} style={{ color:"#22D3EE" }} />,   text:"Answer faster to earn more points (up to 300!)" },
            { icon:<Flame size={14} style={{ color:"#F97316" }} />,  text:"Chain correct answers for a +50 Combo Bonus"   },
            { icon:<Shield size={14} style={{ color:"#A78BFA" }} />, text:"10 questions, 10 seconds each — no second chances" },
            { icon:<TrendingUp size={14} style={{ color:"#34D399" }} />, text:"Beat your best record to earn a LEGEND badge"  },
          ].map((r, i) => (
            <motion.div key={i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.05*i }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background:"rgba(10,15,30,0.7)", border:"1px solid rgba(255,255,255,0.05)", backdropFilter:"blur(6px)" }}>
              {r.icon}
              <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.8rem", color:"#9CA3AF" }}>{r.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Start */}
        <motion.button
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
          whileTap={{ scale:0.97 }} onClick={onStart}
          className="flex items-center justify-center gap-2.5 py-4 rounded-2xl w-full"
          style={{
            background:"linear-gradient(135deg, #7C2D12, #EA580C, #6D28D9)",
            border:"1.5px solid rgba(249,115,22,0.5)",
            boxShadow:"0 0 36px rgba(249,115,22,0.45), 0 0 60px rgba(109,40,217,0.2)",
            cursor:"pointer",
          }}>
          <Zap size={18} style={{ color:"#FBBF24" }} />
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.05rem", color:"#fff", letterSpacing:"0.06em" }}>
            START FASTEST MODE
          </span>
        </motion.button>

      </div>
    </div>
  );
}

/* ─── Done screen ───────────────────────────────────────────────────────── */
function DoneScreen({ correct, total, pts, totalTimeMs, bestRecord, isNewRecord, onRestart, onBack }: {
  correct: number; total: number; pts: number; totalTimeMs: number;
  bestRecord: number; isNewRecord: boolean;
  onRestart: () => void; onBack: () => void;
}) {
  const pct    = Math.round((correct / total) * 100);
  const avgMs  = correct > 0 ? Math.round(totalTimeMs / correct) : 0;
  const grade  =
    pct >= 90 ? { label:"LEGEND!", emoji:"👑", color:"#FBBF24" }
    : pct >= 70 ? { label:"BLAZING!", emoji:"🔥", color:"#F97316" }
    : pct >= 50 ? { label:"SPEEDY!", emoji:"⚡", color:"#22D3EE" }
    : { label:"KEEP TRAINING!", emoji:"💪", color:"#A78BFA" };

  const rankLabel =
    pts >= 1800 ? { text:"#1 LEGEND", color:"#FBBF24", bg:"rgba(251,191,36,0.2)" }
    : pts >= 1400 ? { text:"TOP 10",   color:"#22D3EE", bg:"rgba(34,211,238,0.15)" }
    : pts >= 900  ? { text:"TOP 50",   color:"#A78BFA", bg:"rgba(167,139,250,0.15)" }
    : { text:"ROOKIE", color:"#9CA3AF", bg:"rgba(156,163,175,0.12)" };

  return (
    <motion.div
      initial={{ opacity:0, scale:0.93 }} animate={{ opacity:1, scale:1 }}
      className="flex flex-col items-center gap-5 pb-4 relative"
    >
      <NeonParticles />
      <div className="relative z-10 w-full flex flex-col items-center gap-5">

        {/* Grade trophy */}
        <motion.div
          initial={{ scale:0.4, rotate:-20 }}
          animate={{ scale:1, rotate:0 }}
          transition={{ type:"spring", stiffness:180, damping:14 }}
          className="w-28 h-28 rounded-3xl flex items-center justify-center relative"
          style={{
            background:`linear-gradient(135deg, ${grade.color}35, ${grade.color}10)`,
            border:`2px solid ${grade.color}55`,
            boxShadow:`0 0 64px ${grade.color}35, inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        >
          <span style={{ fontSize:"3.2rem" }}>{grade.emoji}</span>
          <motion.div
            animate={{ opacity:[0.3,0.65,0.3], scale:[1,1.06,1] }}
            transition={{ duration:2, repeat:Infinity }}
            className="absolute inset-0 rounded-3xl"
            style={{ border:`2px solid ${grade.color}`, opacity:0.35 }}
          />
        </motion.div>

        <div className="flex flex-col items-center gap-1.5">
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.7rem", color:grade.color, letterSpacing:"0.04em" }}>
            {grade.label}
          </span>
          {isNewRecord && (
            <motion.div
              initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:200, delay:0.3 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background:"rgba(251,191,36,0.25)", border:"1px solid rgba(251,191,36,0.6)", boxShadow:"0 0 24px rgba(251,191,36,0.3)" }}>
              <Star size={12} style={{ color:"#FBBF24" }} />
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#FBBF24" }}>
                🎉 NEW PERSONAL RECORD!
              </span>
            </motion.div>
          )}
          <span style={{ color:"#6B7280", fontSize:"0.78rem" }}>{correct}/{total} correct · {(totalTimeMs/1000).toFixed(1)}s total</span>
        </div>

        {/* Rank badge */}
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl"
          style={{ background:rankLabel.bg, border:`1.5px solid ${rankLabel.color}55`, boxShadow:`0 0 24px ${rankLabel.color}20` }}>
          <Shield size={15} style={{ color:rankLabel.color }} />
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"0.95rem", color:rankLabel.color, letterSpacing:"0.06em" }}>
            {rankLabel.text} — {pts.toLocaleString()} PTS
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          {[
            { label:"Points Earned",   value:`+${pts.toLocaleString()}`, icon:"🪙", color:"#FBBF24" },
            { label:"Accuracy",         value:`${pct}%`,                  icon:"🎯", color:"#22D3EE" },
            { label:"Avg Speed",        value:`${avgMs}ms`,               icon:"⚡", color:"#F97316" },
            { label:"Best Record",      value:`${bestRecord.toLocaleString()}`, icon:"🏆", color:"#A78BFA" },
          ].map((s) => (
            <motion.div key={s.label}
              initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
              className="flex flex-col items-center rounded-2xl py-4 px-3"
              style={{
                background:"linear-gradient(145deg, rgba(10,15,30,0.9), rgba(26,16,64,0.8))",
                border:`1px solid ${s.color}28`,
                boxShadow:`0 0 16px ${s.color}10`,
                backdropFilter:"blur(12px)",
              }}>
              <span style={{ fontSize:"1.4rem" }}>{s.icon}</span>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.05rem", color:s.color, marginTop:4 }}>
                {s.value}
              </span>
              <span style={{ color:"#9CA3AF", fontSize:"0.62rem" }}>{s.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Accuracy bar */}
        <div className="w-full rounded-2xl px-5 py-4"
          style={{
            background:"linear-gradient(145deg, rgba(10,15,30,0.9), rgba(26,16,64,0.8))",
            border:"1px solid rgba(249,115,22,0.22)",
            backdropFilter:"blur(12px)",
          }}>
          <div className="flex justify-between mb-2">
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.68rem", color:"#6B7280", letterSpacing:"0.08em" }}>ACCURACY</span>
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.68rem", color:grade.color }}>{pct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full" style={{ background:"rgba(255,255,255,0.06)" }}>
            <motion.div
              initial={{ width:0 }}
              animate={{ width:`${pct}%` }}
              transition={{ delay:0.35, duration:0.75, ease:"easeOut" }}
              className="h-full rounded-full"
              style={{ background:`linear-gradient(90deg, #F97316, ${grade.color})`, boxShadow:`0 0 12px ${grade.color}55` }}
            />
          </div>

          {/* Record comparison */}
          <div className="mt-3 pt-2.5 flex items-center gap-2" style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
            <TrendingUp size={12} style={{ color: pts >= bestRecord ? "#34D399" : "#F87171" }} />
            <span style={{ color:"#9CA3AF", fontSize:"0.75rem" }}>
              {pts >= bestRecord
                ? `New record! +${(pts-bestRecord).toLocaleString()} above previous best`
                : `${(bestRecord-pts).toLocaleString()} pts away from your best record`}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <motion.button whileTap={{ scale:0.97 }} onClick={onRestart}
            className="flex items-center justify-center gap-2.5 py-4 rounded-2xl w-full"
            style={{
              background:"linear-gradient(135deg, #7C2D12, #EA580C, #6D28D9)",
              border:"1.5px solid rgba(249,115,22,0.5)",
              boxShadow:"0 0 36px rgba(249,115,22,0.4), 0 0 60px rgba(109,40,217,0.2)",
              cursor:"pointer",
            }}>
            <Zap size={18} style={{ color:"#FBBF24" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.05rem", color:"#fff", letterSpacing:"0.06em" }}>
              PLAY AGAIN
            </span>
          </motion.button>

          <motion.button whileTap={{ scale:0.97 }} onClick={onBack}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl w-full"
            style={{ background:"rgba(249,115,22,0.08)", border:"1px solid rgba(249,115,22,0.28)", cursor:"pointer" }}>
            <ArrowLeft size={15} style={{ color:"#FB923C" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.9rem", color:"#FB923C", letterSpacing:"0.04em" }}>
              BACK TO HOME
            </span>
          </motion.button>
        </div>

      </div>
    </motion.div>
  );
}
