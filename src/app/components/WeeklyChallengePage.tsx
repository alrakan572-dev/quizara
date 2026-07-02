import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Trophy, Gift, Check, Lock,
  Puzzle, Brain, Box, Calendar, Zap, Search, Timer,
  ChevronRight, Star, Flame,
} from "lucide-react";
import confetti from "canvas-confetti";

/* ─── Mission data ───────────────────────────────────────────────────────── */
interface Mission {
  id: number; label: string; desc: string; icon: typeof Puzzle;
  progress: number; total: number; pts: number; done: boolean; color: string;
}

const INITIAL_MISSIONS: Mission[] = [
  { id:1, label:"Riddle Master",    desc:"Solve 10 riddles",              icon:Puzzle,   progress:10, total:10, pts:200, done:true,  color:"#A78BFA" },
  { id:2, label:"Knowledge King",   desc:"Win 5 General Knowledge quizzes",icon:Brain,   progress:5,  total:5,  pts:300, done:true,  color:"#22D3EE" },
  { id:3, label:"Lucky Hunter",     desc:"Open 3 Lucky Boxes",            icon:Box,      progress:2,  total:3,  pts:150, done:false, color:"#FBBF24" },
  { id:4, label:"Daily Warrior",    desc:"Complete Daily Challenge",       icon:Calendar, progress:0,  total:1,  pts:250, done:false, color:"#34D399" },
  { id:5, label:"Point Scorer",     desc:"Score 1,000 points",            icon:Star,     progress:780,total:1000,pts:200,done:false, color:"#F97316" },
  { id:6, label:"Eagle Eye",        desc:"Find 5 Differences",            icon:Search,   progress:3,  total:5,  pts:175, done:false, color:"#F87171" },
  { id:7, label:"Speed Demon",      desc:"Play Fastest Mode",             icon:Timer,    progress:1,  total:1,  pts:150, done:true,  color:"#22D3EE" },
];

const TOTAL_REWARD = 2000;

/* ─── Countdown to end of week (next Monday 00:00) ──────────────────────── */
function useWeekCountdown() {
  const [t, setT] = useState({ d:0, h:0, m:0, s:0 });
  useEffect(() => {
    const tick = () => {
      const now   = new Date();
      const next  = new Date();
      next.setDate(now.getDate() + (7 - now.getDay()) % 7 || 7);
      next.setHours(0, 0, 0, 0);
      const diff  = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
      setT({ d:Math.floor(diff/86400), h:Math.floor((diff%86400)/3600), m:Math.floor((diff%3600)/60), s:diff%60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function pad(n: number) { return String(n).padStart(2,"0"); }

/* ─── Neon particles ─────────────────────────────────────────────────────── */
function NeonParticles() {
  const pts = Array.from({ length:18 }, (_, i) => ({
    id:i, x:Math.random()*100, y:Math.random()*100, size:1.5+Math.random()*2.5,
    color:i%4===0?"#6D28D9":i%4===1?"#22D3EE":i%4===2?"#A78BFA":"#FBBF24",
    dur:3+Math.random()*4, delay:Math.random()*3,
  }));
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex:0 }}>
      {pts.map((p) => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size, background:p.color, filter:"blur(1px)" }}
          animate={{ opacity:[0.08,0.45,0.08], y:[-7,7,-7], scale:[1,1.4,1] }}
          transition={{ duration:p.dur, delay:p.delay, repeat:Infinity, ease:"easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Mission row ────────────────────────────────────────────────────────── */
function MissionRow({ m, index, onToggle }: { m: Mission; index: number; onToggle: (id: number) => void }) {
  const Icon = m.icon;
  const pct  = Math.min(100, Math.round((m.progress / m.total) * 100));

  return (
    <motion.div
      initial={{ opacity:0, x:-16 }}
      animate={{ opacity:1, x:0 }}
      transition={{ delay:index*0.055, type:"spring", stiffness:180, damping:20 }}
      onClick={() => onToggle(m.id)}
      className="relative flex items-center gap-3 px-4 py-3.5 rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: m.done
          ? `linear-gradient(135deg, rgba(52,211,153,0.12), rgba(10,15,30,0.88))`
          : `linear-gradient(135deg, rgba(10,15,30,0.88), rgba(26,16,64,0.72))`,
        border: m.done
          ? "1px solid rgba(52,211,153,0.38)"
          : `1px solid ${m.color}28`,
        boxShadow: m.done ? "0 0 18px rgba(52,211,153,0.12)" : "none",
        backdropFilter:"blur(10px)",
        transition:"all 0.3s ease",
      }}
    >
      {/* Completion fill */}
      {!m.done && pct > 0 && (
        <div className="absolute left-0 top-0 h-full rounded-2xl"
          style={{ width:`${pct}%`, background:`${m.color}08`, transition:"width 0.6s ease" }} />
      )}

      {/* Icon */}
      <div className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: m.done ? "rgba(52,211,153,0.2)" : `${m.color}20`,
          border:`1.5px solid ${m.done ? "#34D39966" : m.color+"55"}`,
          boxShadow: m.done ? "0 0 12px rgba(52,211,153,0.3)" : `0 0 10px ${m.color}22`,
        }}>
        <Icon size={17} style={{ color: m.done ? "#34D399" : m.color }} />
        {m.done && (
          <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
            transition={{ type:"spring", stiffness:280 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background:"#34D399", border:"2px solid #111827" }}>
            <Check size={10} style={{ color:"#111827" }} strokeWidth={3} />
          </motion.div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 relative">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.85rem",
            color: m.done ? "#34D399" : "#F0F4FF" }}>
            {m.label}
          </span>
        </div>
        <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.68rem", color:"#9CA3AF" }}>
          {m.desc}
        </span>
        {/* Progress bar */}
        {!m.done && (
          <div className="mt-1.5 w-full h-1 rounded-full" style={{ background:"rgba(255,255,255,0.07)" }}>
            <motion.div
              initial={{ width:0 }}
              animate={{ width:`${pct}%` }}
              transition={{ delay:0.2+index*0.04, duration:0.7 }}
              className="h-full rounded-full"
              style={{ background:`linear-gradient(90deg, ${m.color}99, ${m.color})` }}
            />
          </div>
        )}
        {!m.done && (
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.58rem", color:`${m.color}cc`, marginTop:2, display:"block" }}>
            {m.progress.toLocaleString()} / {m.total.toLocaleString()}
          </span>
        )}
      </div>

      {/* Points chip */}
      <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
          style={{
            background: m.done ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.1)",
            border:`1px solid ${m.done ? "rgba(52,211,153,0.35)" : "rgba(251,191,36,0.25)"}`,
          }}>
          <Zap size={10} style={{ color: m.done ? "#34D399" : "#FBBF24" }} />
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.62rem",
            color: m.done ? "#34D399" : "#FBBF24" }}>
            +{m.pts}
          </span>
        </div>
        {m.done && (
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.5rem", color:"#34D399" }}>EARNED</span>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface Props { onBack: () => void; userPoints: number; onPointsUpdate: (p: number) => void; }

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════════ */
export function WeeklyChallengePage({ onBack, userPoints, onPointsUpdate }: Props) {
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [claimed,  setClaimed]  = useState(false);
  const countdown = useWeekCountdown();

  const completedCount = missions.filter((m) => m.done).length;
  const allDone        = completedCount === missions.length;
  const progressPct    = Math.round((completedCount / missions.length) * 100);
  const earnedSoFar    = missions.filter((m) => m.done).reduce((s, m) => s + m.pts, 0);

  /* Demo: toggle mission done on tap */
  const handleToggle = (id: number) => {
    setMissions((ms) => ms.map((m) =>
      m.id === id ? { ...m, done:!m.done, progress: !m.done ? m.total : 0 } : m
    ));
  };

  const handleClaim = () => {
    if (!allDone || claimed) return;
    setClaimed(true);
    onPointsUpdate(userPoints + TOTAL_REWARD);
    confetti({ particleCount:120, spread:110, origin:{ x:0.5, y:0.4 },
      colors:["#6D28D9","#22D3EE","#FBBF24","#A78BFA","#34D399"] });
    setTimeout(() => {
      confetti({ particleCount:70, angle:60,  spread:80, origin:{ x:0, y:0.5 },
        colors:["#FBBF24","#A78BFA","#34D399"] });
      confetti({ particleCount:70, angle:120, spread:80, origin:{ x:1, y:0.5 },
        colors:["#6D28D9","#22D3EE","#F97316"] });
    }, 300);
  };

  return (
    <div className="flex flex-col gap-4 pb-2 relative">
      <NeonParticles />
      <div className="relative flex flex-col gap-4" style={{ zIndex:1 }}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
          className="flex items-center justify-between">
          <motion.button whileTap={{ scale:0.92 }} onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background:"rgba(109,40,217,0.15)", border:"1px solid rgba(109,40,217,0.35)", color:"#A78BFA", cursor:"pointer" }}>
            <ArrowLeft size={15} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.82rem" }}>Back</span>
          </motion.button>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize:"1rem" }}>🏅</span>
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1rem", color:"#F0F4FF", letterSpacing:"0.04em" }}>
              WEEKLY CHALLENGE
            </span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
            style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)" }}>
            <Flame size={11} style={{ color:"#FBBF24" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.7rem", color:"#FBBF24" }}>
              {completedCount}/7
            </span>
          </div>
        </motion.div>

        {/* ── HERO CARD ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.05 }}
          className="relative rounded-3xl overflow-hidden px-5 py-5"
          style={{
            background:"linear-gradient(145deg, rgba(26,16,64,0.97) 0%, rgba(10,15,30,0.97) 100%)",
            border:"1.5px solid rgba(109,40,217,0.4)",
            boxShadow:"0 0 60px rgba(109,40,217,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
            backdropFilter:"blur(20px)",
          }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background:"#6D28D9" }} />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-3xl opacity-15" style={{ background:"#22D3EE" }} />

          <div className="relative flex items-center gap-4">
            {/* Glowing trophy */}
            <motion.div
              animate={{ boxShadow:["0 0 16px #FBBF2455","0 0 36px #FBBF2499","0 0 16px #FBBF2455"],
                y:[0,-4,0] }}
              transition={{ duration:2.2, repeat:Infinity, ease:"easeInOut" }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background:"linear-gradient(135deg, rgba(217,119,6,0.4), rgba(251,191,36,0.25))",
                border:"1.5px solid rgba(251,191,36,0.55)",
              }}
            >
              <Trophy size={28} style={{ color:"#FBBF24" }} />
            </motion.div>

            <div className="flex-1 min-w-0">
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"0.88rem",
                color:"#F0F4FF", letterSpacing:"0.03em" }}>
                WEEK'S GRAND REWARD
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize:"1.5rem", color:"#FBBF24" }}>
                  {TOTAL_REWARD.toLocaleString()}
                </span>
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.72rem", color:"#9CA3AF" }}>pts bonus</span>
              </div>
              <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.65rem", color:"#9CA3AF" }}>
                + exclusive weekly badge
              </span>

              {/* Overall progress */}
              <div className="mt-2.5">
                <div className="flex justify-between mb-1">
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.6rem", color:"#6B7280" }}>
                    {completedCount}/{missions.length} missions done
                  </span>
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.6rem",
                    color: allDone ? "#34D399" : "#A78BFA" }}>
                    {progressPct}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background:"rgba(255,255,255,0.07)" }}>
                  <motion.div
                    animate={{ width:`${progressPct}%` }}
                    transition={{ duration:0.5, ease:"easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: allDone
                        ? "linear-gradient(90deg, #34D399, #22D3EE)"
                        : "linear-gradient(90deg, #6D28D9, #A78BFA)",
                      boxShadow: allDone ? "0 0 10px rgba(52,211,153,0.5)" : "0 0 8px rgba(167,139,250,0.4)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Countdown timer */}
          <div className="relative mt-4 flex items-center justify-between px-3 py-2.5 rounded-2xl"
            style={{ background:"rgba(10,15,30,0.7)", border:"1px solid rgba(34,211,238,0.2)" }}>
            <div className="flex items-center gap-1.5">
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.6rem", color:"#6B7280", letterSpacing:"0.08em" }}>
                RESETS IN
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { label:"DAYS",  value:countdown.d },
                { label:"HRS",   value:countdown.h },
                { label:"MIN",   value:countdown.m },
              ].map((seg, i) => (
                <div key={seg.label} className="flex items-center gap-1.5">
                  <div className="flex flex-col items-center">
                    <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.25rem",
                      color:"#22D3EE", lineHeight:1 }}>
                      {pad(seg.value)}
                    </span>
                    <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.46rem", color:"#4B5563", letterSpacing:"0.08em" }}>
                      {seg.label}
                    </span>
                  </div>
                  {i < 2 && <span style={{ color:"#22D3EE", fontWeight:800, fontSize:"1rem", marginBottom:8 }}>:</span>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── EARNED SO FAR ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.2)" }}>
          <Star size={13} style={{ color:"#FBBF24" }} />
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.75rem", color:"#9CA3AF" }}>
            Earned this week:
          </span>
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"0.9rem", color:"#FBBF24", marginLeft:"auto" }}>
            +{earnedSoFar} pts
          </span>
        </div>

        {/* ── MISSIONS ────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Gift size={13} style={{ color:"#A78BFA" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem",
              color:"#6B7280", letterSpacing:"0.1em" }}>
              DAILY MISSIONS
            </span>
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.62rem", color:"#6B7280" }}>
              — tap to toggle (demo)
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {missions.map((m, i) => (
              <MissionRow key={m.id} m={m} index={i} onToggle={handleToggle} />
            ))}
          </div>
        </div>

        {/* ── CLAIM REWARD ────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {claimed ? (
            <motion.div
              key="claimed"
              initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl"
              style={{ background:"rgba(52,211,153,0.12)", border:"1.5px solid rgba(52,211,153,0.4)",
                boxShadow:"0 0 32px rgba(52,211,153,0.2)" }}>
              <span style={{ fontSize:"2rem" }}>🎉</span>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.1rem", color:"#34D399" }}>
                REWARD CLAIMED!
              </span>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.8rem", color:"#9CA3AF" }}>
                +{TOTAL_REWARD.toLocaleString()} pts added to your account
              </span>
            </motion.div>
          ) : (
            <motion.div key="claim-btn" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              className="flex flex-col gap-2">
              {/* Progress note */}
              {!allDone && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ background:"rgba(109,40,217,0.1)", border:"1px solid rgba(109,40,217,0.22)" }}>
                  <Lock size={12} style={{ color:"#6B7280" }} />
                  <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.7rem", color:"#6B7280" }}>
                    Complete all 7 missions to unlock the reward
                  </span>
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.7rem",
                    color:"#A78BFA", marginLeft:"auto" }}>
                    {missions.length - completedCount} left
                  </span>
                </div>
              )}

              <motion.button
                whileTap={allDone ? { scale:0.97 } : {}}
                onClick={handleClaim}
                disabled={!allDone}
                className="flex items-center justify-center gap-2.5 py-4 rounded-2xl w-full relative overflow-hidden"
                style={{
                  background: allDone
                    ? "linear-gradient(135deg, #92400E, #D97706, #FBBF24)"
                    : "rgba(255,255,255,0.05)",
                  border: allDone
                    ? "1.5px solid rgba(251,191,36,0.55)"
                    : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: allDone
                    ? "0 0 36px rgba(251,191,36,0.45), 0 0 60px rgba(109,40,217,0.15)"
                    : "none",
                  cursor: allDone ? "pointer" : "not-allowed",
                  opacity: allDone ? 1 : 0.5,
                  transition:"all 0.3s ease",
                }}
              >
                {allDone && (
                  <motion.div animate={{ x:["-100%","200%"] }}
                    transition={{ duration:2.5, repeat:Infinity, ease:"linear" }}
                    className="absolute inset-0"
                    style={{ background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)", width:"45%" }} />
                )}
                {allDone
                  ? <><Trophy size={20} style={{ color:"#111827" }} />
                      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize:"1.05rem",
                        color:"#111827", letterSpacing:"0.06em" }}>
                        CLAIM {TOTAL_REWARD.toLocaleString()} POINTS REWARD
                      </span></>
                  : <><Lock size={18} style={{ color:"#4B5563" }} />
                      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"1rem",
                        color:"#4B5563", letterSpacing:"0.05em" }}>
                        COMPLETE ALL MISSIONS TO CLAIM
                      </span></>
                }
              </motion.button>

              {allDone && (
                <motion.button whileTap={{ scale:0.97 }} onClick={onBack}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl w-full"
                  style={{ background:"rgba(109,40,217,0.1)", border:"1px solid rgba(109,40,217,0.28)", cursor:"pointer" }}>
                  <ArrowLeft size={14} style={{ color:"#A78BFA" }} />
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.88rem", color:"#A78BFA" }}>
                    BACK TO HOME
                  </span>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
