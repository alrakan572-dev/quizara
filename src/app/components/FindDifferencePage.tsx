import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Lightbulb, CheckCircle2, Clock } from "lucide-react";
import confetti from "canvas-confetti";

/* ─── Difference definitions (% of image dimensions) ─────────────────────
   Each difference is a clickable zone on Image B.
   "variant" controls which element differs between A and B.            */
interface Diff {
  id: number; x: number; y: number; r: number; label: string;
}

/* 5 differences — coordinates as % of the SVG viewBox (320 × 200) */
const DIFFERENCES: Diff[] = [
  { id:1, x:62,  y:38,  r:14, label:"Moon size"       },
  { id:2, x:210, y:72,  r:12, label:"Extra star"      },
  { id:3, x:138, y:110, r:13, label:"Window color"    },
  { id:4, x:258, y:128, r:12, label:"Antenna missing" },
  { id:5, x:44,  y:148, r:12, label:"UFO gone"        },
];

const TIMER_TOTAL = 60;
const HINT_LIMIT  = 3;
const REWARD_PTS  = 350;
const DIFF_LEVELS = [
  { label:"EASY",   color:"#34D399", pts:200 },
  { label:"MEDIUM", color:"#FBBF24", pts:350 },
  { label:"HARD",   color:"#F87171", pts:500 },
];
const LEVEL = DIFF_LEVELS[1]; // Medium

/* ─── SVG Scenes ──────────────────────────────────────────────────────────
   Image A = Original. Image B = has 5 differences.
   Both are 320×200 SVG futuristic cityscapes.                           */

/** Shared background + common elements */
function SceneBg() {
  return (
    <>
      {/* Sky gradient */}
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0515" />
          <stop offset="100%" stopColor="#0f0c2e" />
        </linearGradient>
        <linearGradient id="gnd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1040" />
          <stop offset="100%" stopColor="#0a0520" />
        </linearGradient>
        <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6D28D9" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6D28D9" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="url(#sky)" />
      {/* Ground */}
      <rect y="155" width="320" height="45" fill="url(#gnd)" />
      {/* Distant glow */}
      <ellipse cx="160" cy="155" rx="120" ry="30" fill="url(#glow1)" />
      {/* Stars — fixed */}
      {[[20,20],[90,12],[150,25],[280,18],[300,30],[160,8],[230,40],[10,50],[305,55]].map(([sx,sy],i) => (
        <circle key={i} cx={sx} cy={sy} r="1.2" fill="#fff" opacity="0.7" />
      ))}
      {/* Road */}
      <rect y="163" width="320" height="3" fill="#22D3EE" opacity="0.15" />
      {/* Building A left tall */}
      <rect x="15"  y="80"  width="35" height="75" rx="2" fill="#1a1050" stroke="#6D28D9" strokeWidth="0.8" />
      {/* Building B mid */}
      <rect x="65"  y="95"  width="28" height="60" rx="2" fill="#160e40" stroke="#6D28D9" strokeWidth="0.8" />
      {/* Building C center */}
      <rect x="108" y="75"  width="40" height="80" rx="2" fill="#1a1050" stroke="#6D28D9" strokeWidth="0.8" />
      {/* Building D right-mid */}
      <rect x="165" y="90"  width="32" height="65" rx="2" fill="#160e40" stroke="#6D28D9" strokeWidth="0.8" />
      {/* Building E far right */}
      <rect x="240" y="85"  width="38" height="70" rx="2" fill="#1a1050" stroke="#6D28D9" strokeWidth="0.8" />
      {/* Building F tallest */}
      <rect x="288" y="60"  width="28" height="95" rx="2" fill="#13093a" stroke="#6D28D9" strokeWidth="0.8" />
      {/* Neon ground lines */}
      <line x1="0" y1="166" x2="320" y2="166" stroke="#6D28D9" strokeWidth="0.5" opacity="0.4" />
      <line x1="0" y1="172" x2="320" y2="172" stroke="#22D3EE" strokeWidth="0.5" opacity="0.3" />
    </>
  );
}

/** Windows — common to both */
function CommonWindows() {
  const wins = [
    [22,90],[30,90],[22,102],[30,102],[22,114],[30,114],
    [70,102],[85,102],[70,114],[85,114],[70,126],[85,126],
    [115,85],[130,85],[145,85],[115,98],[130,98],[145,98],[115,111],[145,111],
    [170,98],[185,98],[170,110],[185,110],[170,122],[185,122],
    [246,95],[260,95],[275,95],[246,107],[275,107],[246,119],[260,119],[275,119],
    [293,70],[305,70],[293,83],[305,83],[293,96],[305,96],[293,109],[305,109],
  ];
  return (
    <>
      {wins.map(([wx,wy],i) => (
        <rect key={i} x={wx} y={wy} width="5" height="4" rx="0.5"
          fill="#22D3EE" opacity={0.35 + Math.random()*0.25} />
      ))}
    </>
  );
}

/** Image A — Original */
function SceneA() {
  return (
    <svg viewBox="0 0 320 200" width="100%" preserveAspectRatio="xMidYMid meet">
      <SceneBg />
      <CommonWindows />
      {/* DIFF 1: Moon — larger in A */}
      <circle cx="62" cy="38" r="18" fill="#1a1050" stroke="#A78BFA" strokeWidth="1" />
      <circle cx="62" cy="38" r="14" fill="#2d1b69" />
      <circle cx="57" cy="33" r="4" fill="#3d2580" opacity="0.6" />
      {/* DIFF 2: Star — present in A */}
      <polygon points="210,62 212,68 218,68 213,72 215,78 210,74 205,78 207,72 202,68 208,68"
        fill="#FBBF24" opacity="0.9" />
      {/* DIFF 3: Window color — CYAN in A */}
      <rect x="130" y="111" width="7" height="5" rx="0.5" fill="#22D3EE" opacity="0.9" />
      {/* DIFF 4: Antenna — present in A */}
      <line x1="258" y1="85" x2="258" y2="70" stroke="#22D3EE" strokeWidth="1.5" opacity="0.8" />
      <circle cx="258" cy="69" r="2.5" fill="#22D3EE" />
      {/* DIFF 5: UFO — present in A */}
      <ellipse cx="44" cy="148" rx="12" ry="5" fill="#6D28D9" opacity="0.85" />
      <ellipse cx="44" cy="145" rx="6" ry="4" fill="#A78BFA" opacity="0.7" />
      <circle cx="40" cy="147" r="1.2" fill="#22D3EE" opacity="0.9" />
      <circle cx="44" cy="147" r="1.2" fill="#22D3EE" opacity="0.9" />
      <circle cx="48" cy="147" r="1.2" fill="#22D3EE" opacity="0.9" />
    </svg>
  );
}

/** Image B — 5 differences hidden */
function SceneB({ found, hinted }: { found: Set<number>; hinted: Set<number> }) {
  const showMarker = (id: number) => found.has(id) || hinted.has(id);
  return (
    <svg viewBox="0 0 320 200" width="100%" preserveAspectRatio="xMidYMid meet">
      <SceneBg />
      <CommonWindows />
      {/* DIFF 1: Moon — SMALLER in B */}
      <circle cx="62" cy="38" r="11" fill="#1a1050" stroke="#A78BFA" strokeWidth="1" />
      <circle cx="62" cy="38" r="8"  fill="#2d1b69" />
      <circle cx="59" cy="35" r="2.5" fill="#3d2580" opacity="0.6" />
      {showMarker(1) && <DiffMarker cx={DIFFERENCES[0].x} cy={DIFFERENCES[0].y} r={DIFFERENCES[0].r} found={found.has(1)} />}
      {/* DIFF 2: Star — ABSENT in B */}
      {showMarker(2) && <DiffMarker cx={DIFFERENCES[1].x} cy={DIFFERENCES[1].y} r={DIFFERENCES[1].r} found={found.has(2)} />}
      {/* DIFF 3: Window color — ORANGE in B */}
      <rect x="130" y="111" width="7" height="5" rx="0.5" fill="#F97316" opacity="0.9" />
      {showMarker(3) && <DiffMarker cx={DIFFERENCES[2].x} cy={DIFFERENCES[2].y} r={DIFFERENCES[2].r} found={found.has(3)} />}
      {/* DIFF 4: Antenna — ABSENT in B */}
      {showMarker(4) && <DiffMarker cx={DIFFERENCES[3].x} cy={DIFFERENCES[3].y} r={DIFFERENCES[3].r} found={found.has(4)} />}
      {/* DIFF 5: UFO — ABSENT in B */}
      {showMarker(5) && <DiffMarker cx={DIFFERENCES[4].x} cy={DIFFERENCES[4].y} r={DIFFERENCES[4].r} found={found.has(5)} />}
    </svg>
  );
}

function DiffMarker({ cx, cy, r, found }: { cx:number; cy:number; r:number; found:boolean }) {
  return (
    <motion.g initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:"spring", stiffness:280, damping:18 }}>
      <circle cx={cx} cy={cy} r={r+3} fill="none" stroke={found ? "#34D399" : "#FBBF24"}
        strokeWidth="2" opacity="0.5" strokeDasharray="4 3" />
      <circle cx={cx} cy={cy} r={r} fill={found ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)"}
        stroke={found ? "#34D399" : "#FBBF24"} strokeWidth="1.5" />
      {found && (
        <text x={cx} y={cy+4} textAnchor="middle" fontSize="10" fill="#34D399">✓</text>
      )}
    </motion.g>
  );
}

/* ─── Circular Timer ──────────────────────────────────────────────────────── */
function CircleTimer({ timeLeft, total }: { timeLeft:number; total:number }) {
  const R   = 28;
  const C   = 2 * Math.PI * R;
  const pct = timeLeft / total;
  const col = timeLeft > 30 ? "#22D3EE" : timeLeft > 15 ? "#FBBF24" : "#F87171";
  return (
    <div className="relative flex items-center justify-center" style={{ width:72, height:72 }}>
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
        <motion.circle
          cx="36" cy="36" r={R} fill="none"
          stroke={col} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - pct) }}
          transition={{ duration:0.9, ease:"linear" }}
          style={{ filter:`drop-shadow(0 0 6px ${col})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span
          key={timeLeft}
          initial={{ scale:1.2, opacity:0.6 }} animate={{ scale:1, opacity:1 }}
          style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.1rem", color:col, lineHeight:1 }}
        >
          {timeLeft}
        </motion.span>
        <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.48rem", color:"#6B7280" }}>SEC</span>
      </div>
    </div>
  );
}

/* ─── Neon Particles ─────────────────────────────────────────────────────── */
function NeonParticles() {
  const p = Array.from({ length:18 }, (_, i) => ({
    id:i, x:Math.random()*100, y:Math.random()*100, size:1.5+Math.random()*2.5,
    color:i%3===0?"#6D28D9":i%3===1?"#22D3EE":"#A78BFA",
    dur:3+Math.random()*4, delay:Math.random()*3,
  }));
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex:0 }}>
      {p.map((pp) => (
        <motion.div key={pp.id} className="absolute rounded-full"
          style={{ left:`${pp.x}%`, top:`${pp.y}%`, width:pp.size, height:pp.size, background:pp.color, filter:"blur(1px)" }}
          animate={{ opacity:[0.08,0.45,0.08], y:[-7,7,-7], scale:[1,1.4,1] }}
          transition={{ duration:pp.dur, delay:pp.delay, repeat:Infinity, ease:"easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Props & state ──────────────────────────────────────────────────────── */
interface Props { onBack: () => void; userPoints: number; onPointsUpdate: (p:number) => void; }
type Phase = "playing" | "success" | "fail";

/* ═══════════════════════════════════════════════════════════════════════════ */
export function FindDifferencePage({ onBack, userPoints, onPointsUpdate }: Props) {
  const [phase,    setPhase]    = useState<Phase>("playing");
  const [found,    setFound]    = useState<Set<number>>(new Set());
  const [hinted,   setHinted]   = useState<Set<number>>(new Set());
  const [hintsLeft,setHintsLeft]= useState(HINT_LIMIT);
  const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL);
  const [wrongFlash,setWrong]   = useState(false);
  const [foundBurst,setFBurst]  = useState<number|null>(null);
  const imgBRef                 = useRef<SVGSVGElement>(null);
  const timerRef                = useRef<ReturnType<typeof setInterval>|null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { stopTimer(); setPhase("fail"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => stopTimer();
  }, [stopTimer]);

  /* Click handler on Image B SVG wrapper */
  const handleImageBClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== "playing") return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const scaleX = 320 / rect.width;
    const scaleY = 200 / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top)  * scaleY;

    for (const diff of DIFFERENCES) {
      if (found.has(diff.id)) continue;
      const dx = cx - diff.x, dy = cy - diff.y;
      if (Math.sqrt(dx*dx + dy*dy) <= diff.r + 6) {
        const next = new Set(found);
        next.add(diff.id);
        setFound(next);
        setFBurst(diff.id);
        setTimeout(() => setFBurst(null), 900);
        if (next.size === DIFFERENCES.length) {
          stopTimer();
          onPointsUpdate(userPoints + LEVEL.pts);
          setTimeout(() => {
            setPhase("success");
            confetti({ particleCount:100, spread:100, origin:{ x:0.5, y:0.4 },
              colors:["#6D28D9","#22D3EE","#FBBF24","#A78BFA","#34D399"] });
            setTimeout(() => confetti({ particleCount:60, angle:60,  spread:70, origin:{ x:0, y:0.5 },
              colors:["#6D28D9","#22D3EE","#FBBF24"] }), 300);
            setTimeout(() => confetti({ particleCount:60, angle:120, spread:70, origin:{ x:1, y:0.5 },
              colors:["#A78BFA","#34D399","#FBBF24"] }), 500);
          }, 400);
        }
        return;
      }
    }
    /* Wrong click flash */
    setWrong(true);
    setTimeout(() => setWrong(false), 350);
  };

  const handleHint = () => {
    if (hintsLeft <= 0 || phase !== "playing") return;
    const unfound = DIFFERENCES.filter((d) => !found.has(d.id) && !hinted.has(d.id));
    if (!unfound.length) return;
    const pick = unfound[Math.floor(Math.random() * unfound.length)];
    setHinted((h) => new Set([...h, pick.id]));
    setHintsLeft((n) => n - 1);
  };

  const handleReset = () => {
    setPhase("playing"); setFound(new Set()); setHinted(new Set());
    setHintsLeft(HINT_LIMIT); setTimeLeft(TIMER_TOTAL); setWrong(false);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { stopTimer(); setPhase("fail"); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const allFound = found.size === DIFFERENCES.length;
  const timerColor = timeLeft > 30 ? "#22D3EE" : timeLeft > 15 ? "#FBBF24" : "#F87171";

  /* ── SUCCESS ────────────────────────────────────────────────────────── */
  if (phase === "success") {
    return (
      <motion.div initial={{ opacity:0, scale:0.94 }} animate={{ opacity:1, scale:1 }}
        className="flex flex-col items-center gap-5 py-4 relative">
        <NeonParticles />
        <div className="relative z-10 flex flex-col items-center gap-5 w-full">
          <motion.button whileTap={{ scale:0.92 }} onClick={onBack}
            className="self-start flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background:"rgba(34,211,238,0.1)", border:"1px solid rgba(34,211,238,0.3)", color:"#67E8F9", cursor:"pointer" }}>
            <ArrowLeft size={15} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.82rem" }}>Home</span>
          </motion.button>

          <motion.div initial={{ scale:0.4, rotate:-15 }} animate={{ scale:1, rotate:0 }}
            transition={{ type:"spring", stiffness:180, damping:14 }}
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
            style={{
              background:"linear-gradient(135deg, rgba(52,211,153,0.3), rgba(34,211,238,0.15))",
              border:"2px solid rgba(52,211,153,0.55)",
              boxShadow:"0 0 60px rgba(52,211,153,0.35)",
            }}>
            🎉
          </motion.div>
          <div className="flex flex-col items-center gap-1">
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize:"1.7rem",
              background:"linear-gradient(90deg, #34D399, #22D3EE)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              EXCELLENT!
            </span>
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.9rem", color:"#FBBF24" }}>
              All 5 differences found!
            </span>
          </div>

          <div className="w-full px-2 flex gap-3">
            {[
              { label:"Points Earned", value:`+${LEVEL.pts}`, icon:"🪙", color:"#FBBF24" },
              { label:"Accuracy",      value:"100%",           icon:"🎯", color:"#34D399" },
              { label:"Time Left",     value:`${timeLeft}s`,   icon:"⏱️", color:"#22D3EE" },
            ].map((s) => (
              <motion.div key={s.label} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                className="flex-1 flex flex-col items-center py-3.5 rounded-2xl gap-1"
                style={{ background:"rgba(10,15,30,0.88)", border:`1px solid ${s.color}33`,
                  boxShadow:`0 0 16px ${s.color}12`, backdropFilter:"blur(8px)" }}>
                <span style={{ fontSize:"1.2rem" }}>{s.icon}</span>
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1rem", color:s.color }}>{s.value}</span>
                <span style={{ color:"#6B7280", fontSize:"0.58rem" }}>{s.label}</span>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 w-full">
            <motion.button whileTap={{ scale:0.97 }} onClick={handleReset}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl w-full"
              style={{ background:"linear-gradient(135deg, #0E47A1, #6D28D9)",
                border:"1px solid rgba(34,211,238,0.3)",
                boxShadow:"0 0 28px rgba(34,211,238,0.25), 0 0 48px rgba(109,40,217,0.2)", cursor:"pointer" }}>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"1rem", color:"#fff", letterSpacing:"0.05em" }}>
                PLAY AGAIN
              </span>
              <span style={{ fontSize:"0.9rem" }}>🔎</span>
            </motion.button>
            <motion.button whileTap={{ scale:0.97 }} onClick={onBack}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl w-full"
              style={{ background:"rgba(34,211,238,0.07)", border:"1px solid rgba(34,211,238,0.25)", cursor:"pointer" }}>
              <ArrowLeft size={15} style={{ color:"#67E8F9" }} />
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.9rem", color:"#67E8F9" }}>
                BACK TO HOME
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── FAIL ────────────────────────────────────────────────────────────── */
  if (phase === "fail") {
    return (
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
        className="flex flex-col items-center gap-5 py-4 relative">
        <NeonParticles />
        <div className="relative z-10 flex flex-col items-center gap-5 w-full">
          <motion.button whileTap={{ scale:0.92 }} onClick={onBack}
            className="self-start flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", color:"#FCA5A5", cursor:"pointer" }}>
            <ArrowLeft size={15} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.82rem" }}>Home</span>
          </motion.button>

          <motion.div initial={{ scale:0.5 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:180 }}
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
            style={{ background:"rgba(248,113,113,0.15)", border:"2px solid rgba(248,113,113,0.45)",
              boxShadow:"0 0 48px rgba(248,113,113,0.2)" }}>
            ⏰
          </motion.div>
          <div className="flex flex-col items-center gap-1">
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize:"1.7rem", color:"#F87171" }}>
              TIME'S UP!
            </span>
            <span style={{ color:"#9CA3AF", fontSize:"0.8rem" }}>
              Found {found.size} of {DIFFERENCES.length} differences
            </span>
          </div>

          {/* Show all differences on image B */}
          <div className="w-full rounded-2xl overflow-hidden"
            style={{ border:"1.5px solid rgba(248,113,113,0.35)", boxShadow:"0 0 24px rgba(248,113,113,0.15)" }}>
            <div className="w-full" style={{ background:"rgba(10,15,30,0.9)" }}>
              <SceneB found={new Set(DIFFERENCES.map((d) => d.id))} hinted={new Set()} />
            </div>
          </div>
          <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.72rem", color:"#6B7280", textAlign:"center" }}>
            All 5 differences are now revealed above.
          </p>

          <div className="flex flex-col gap-2.5 w-full">
            <motion.button whileTap={{ scale:0.97 }} onClick={handleReset}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl w-full"
              style={{ background:"linear-gradient(135deg, rgba(248,113,113,0.3), rgba(239,68,68,0.2))",
                border:"1px solid rgba(248,113,113,0.4)",
                boxShadow:"0 0 24px rgba(248,113,113,0.2)", cursor:"pointer" }}>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"1rem", color:"#fff", letterSpacing:"0.05em" }}>
                TRY AGAIN
              </span>
            </motion.button>
            <motion.button whileTap={{ scale:0.97 }} onClick={onBack}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl w-full"
              style={{ background:"rgba(109,40,217,0.1)", border:"1px solid rgba(109,40,217,0.3)", cursor:"pointer" }}>
              <ArrowLeft size={15} style={{ color:"#A78BFA" }} />
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.9rem", color:"#A78BFA" }}>
                BACK TO HOME
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── PLAYING ─────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-3 pb-2 relative">
      <NeonParticles />
      <div className="relative flex flex-col gap-3" style={{ zIndex:1 }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <motion.button whileTap={{ scale:0.92 }} onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background:"rgba(34,211,238,0.1)", border:"1px solid rgba(34,211,238,0.3)", color:"#67E8F9", cursor:"pointer" }}>
            <ArrowLeft size={15} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.82rem" }}>Back</span>
          </motion.button>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize:"1rem" }}>🔎</span>
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.9rem", color:"#F0F4FF", letterSpacing:"0.03em" }}>
              FIND THE DIFFERENCE
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full"
            style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.62rem",
              color:LEVEL.color, background:`${LEVEL.color}20`, border:`1px solid ${LEVEL.color}55` }}>
            {LEVEL.label}
          </span>
        </div>

        {/* Timer + points + progress bar */}
        <motion.div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          animate={{ borderColor:`${timerColor}55`, boxShadow:`0 0 20px ${timerColor}15` }}
          style={{
            background:"linear-gradient(135deg, rgba(10,15,30,0.9), rgba(26,16,64,0.8))",
            border:`1.5px solid ${timerColor}55`,
            backdropFilter:"blur(12px)",
          }}
        >
          <CircleTimer timeLeft={timeLeft} total={TIMER_TOTAL} />
          <div className="flex-1">
            {/* Progress dots */}
            <div className="flex items-center justify-between mb-1.5">
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.65rem", color:"#9CA3AF" }}>
                Found {found.size} / {DIFFERENCES.length}
              </span>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.68rem", color:"#FBBF24" }}>
                +{LEVEL.pts} pts
              </span>
            </div>
            <div className="flex gap-1.5 mb-2">
              {DIFFERENCES.map((d) => (
                <motion.div key={d.id}
                  animate={{ background: found.has(d.id) ? "#34D399" : hinted.has(d.id) ? "#FBBF24" : "rgba(255,255,255,0.1)",
                    boxShadow: found.has(d.id) ? "0 0 8px #34D399" : "none" }}
                  transition={{ duration:0.3 }}
                  className="flex-1 h-2 rounded-full"
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              {found.size === DIFFERENCES.length
                ? <CheckCircle2 size={11} style={{ color:"#34D399" }} />
                : <Clock size={11} style={{ color:timerColor }} />}
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.6rem", color:"#6B7280" }}>
                {found.size === DIFFERENCES.length ? "All differences found!" : `${DIFFERENCES.length - found.size} remaining`}
              </span>
            </div>
          </div>
        </motion.div>

        {/* LABEL — Image A */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background:"rgba(34,211,238,0.2)" }} />
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.62rem",
            color:"#22D3EE", letterSpacing:"0.1em" }}>
            ORIGINAL
          </span>
          <div className="flex-1 h-px" style={{ background:"rgba(34,211,238,0.2)" }} />
        </div>

        {/* Image A */}
        <motion.div
          initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
          transition={{ duration:0.4, type:"spring" }}
          className="w-full rounded-2xl overflow-hidden"
          style={{
            border:"1.5px solid rgba(34,211,238,0.3)",
            boxShadow:"0 0 24px rgba(34,211,238,0.12), 0 0 40px rgba(109,40,217,0.1)",
          }}
        >
          <SceneA />
        </motion.div>

        {/* LABEL — Image B */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background:"rgba(167,139,250,0.2)" }} />
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.62rem",
            color:"#A78BFA", letterSpacing:"0.1em" }}>
            FIND THE DIFFERENCES ← TAP HERE
          </span>
          <div className="flex-1 h-px" style={{ background:"rgba(167,139,250,0.2)" }} />
        </div>

        {/* Image B — clickable */}
        <motion.div
          initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
          transition={{ duration:0.4, delay:0.1, type:"spring" }}
          onClick={handleImageBClick}
          className="w-full rounded-2xl overflow-hidden relative cursor-crosshair"
          style={{
            border:`1.5px solid ${wrongFlash ? "#F87171" : "rgba(167,139,250,0.3)"}`,
            boxShadow: wrongFlash
              ? "0 0 28px rgba(248,113,113,0.4)"
              : "0 0 24px rgba(167,139,250,0.12), 0 0 40px rgba(109,40,217,0.1)",
            transition:"border-color 0.2s, box-shadow 0.2s",
          }}
        >
          <SceneB found={found} hinted={hinted} />

          {/* Wrong click flash overlay */}
          <AnimatePresence>
            {wrongFlash && (
              <motion.div
                initial={{ opacity:0.4 }} animate={{ opacity:0 }} transition={{ duration:0.35 }}
                className="absolute inset-0 rounded-2xl"
                style={{ background:"rgba(248,113,113,0.2)", pointerEvents:"none" }}
              />
            )}
          </AnimatePresence>

          {/* Found burst */}
          <AnimatePresence>
            {foundBurst !== null && (
              <motion.div
                initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:1.5 }}
                transition={{ duration:0.4 }}
                className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none"
              >
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl"
                  style={{ background:"rgba(52,211,153,0.25)", border:"1.5px solid rgba(52,211,153,0.55)",
                    boxShadow:"0 0 20px rgba(52,211,153,0.4)" }}>
                  <CheckCircle2 size={13} style={{ color:"#34D399" }} />
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.8rem", color:"#34D399" }}>
                    Difference Found!
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Hint button + instruction */}
        <div className="flex items-center justify-between">
          <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.68rem", color:"#6B7280" }}>
            Tap on Image 2 to find differences
          </span>
          <motion.button
            whileTap={{ scale:0.92 }}
            onClick={handleHint}
            disabled={hintsLeft <= 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{
              background: hintsLeft > 0 ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)",
              border:`1px solid ${hintsLeft > 0 ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.07)"}`,
              boxShadow: hintsLeft > 0 ? "0 0 12px rgba(251,191,36,0.25)" : "none",
              cursor: hintsLeft > 0 ? "pointer" : "not-allowed",
              opacity: hintsLeft <= 0 ? 0.4 : 1,
            }}
          >
            <Lightbulb size={13} style={{ color: hintsLeft > 0 ? "#FBBF24" : "#6B7280" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem",
              color: hintsLeft > 0 ? "#FBBF24" : "#6B7280" }}>
              HINT ({hintsLeft})
            </span>
          </motion.button>
        </div>

        {/* Differences list */}
        <div className="rounded-2xl px-4 py-3"
          style={{ background:"rgba(10,15,30,0.8)", border:"1px solid rgba(109,40,217,0.2)", backdropFilter:"blur(8px)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.65rem",
              color:"#6B7280", letterSpacing:"0.1em" }}>
              DIFFERENCES
            </span>
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.65rem", color:"#34D399" }}>
              {found.size}/{DIFFERENCES.length}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {DIFFERENCES.map((d) => {
              const isFound  = found.has(d.id);
              const isHinted = hinted.has(d.id) && !isFound;
              return (
                <motion.div key={d.id}
                  animate={{ background: isFound ? "rgba(52,211,153,0.08)" : "transparent" }}
                  className="flex items-center gap-2 py-1 rounded-lg px-1">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isFound ? "#34D399" : isHinted ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.07)",
                      border:`1px solid ${isFound ? "#34D399" : isHinted ? "#FBBF2466" : "rgba(255,255,255,0.1)"}`,
                    }}>
                    {isFound && <span style={{ fontSize:"0.55rem" }}>✓</span>}
                    {isHinted && !isFound && <span style={{ fontSize:"0.55rem", color:"#FBBF24" }}>!</span>}
                  </div>
                  <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.72rem",
                    color: isFound ? "#34D399" : isHinted ? "#FBBF24" : "#9CA3AF",
                    textDecoration: isFound ? "none" : "none",
                    opacity: isFound ? 1 : 0.7 }}>
                    {isFound ? d.label : `Difference #${d.id}`}
                  </span>
                  {isFound && (
                    <CheckCircle2 size={11} style={{ color:"#34D399", marginLeft:"auto" }} />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
