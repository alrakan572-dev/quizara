import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "motion/react";
import { ArrowLeft, Star, Gift, Zap, Crown, Sparkles, Clock, ChevronRight, Eye } from "lucide-react";
import confetti from "canvas-confetti";

/* ─── Reward definitions ─────────────────────────────────────────────────── */
type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

interface Reward {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: Rarity;
  color: string;
  glow: string;
  value: string;
}

const RARITY_META: Record<Rarity, { color: string; glow: string; bg: string; label: string; weight: number }> = {
  COMMON:    { color:"#9CA3AF", glow:"rgba(156,163,175,0.3)", bg:"rgba(156,163,175,0.08)", label:"COMMON",    weight:50 },
  RARE:      { color:"#22D3EE", glow:"rgba(34,211,238,0.4)",  bg:"rgba(34,211,238,0.1)",   label:"RARE",      weight:30 },
  EPIC:      { color:"#A78BFA", glow:"rgba(167,139,250,0.45)",bg:"rgba(167,139,250,0.12)", label:"EPIC",      weight:15 },
  LEGENDARY: { color:"#FBBF24", glow:"rgba(251,191,36,0.55)", bg:"rgba(251,191,36,0.15)",  label:"LEGENDARY", weight:5  },
};

const REWARD_POOL: Reward[] = [
  { id:"coins_sm",  name:"Gold Coins",       description:"Small coin reward",          emoji:"🪙", rarity:"COMMON",    color:"#9CA3AF", glow:"rgba(156,163,175,0.3)", value:"+100 pts"   },
  { id:"coins_md",  name:"Coin Stash",        description:"Medium coin reward",         emoji:"💰", rarity:"RARE",      color:"#22D3EE", glow:"rgba(34,211,238,0.4)",  value:"+350 pts"   },
  { id:"coins_lg",  name:"Gold Jackpot",      description:"Massive coin reward",        emoji:"🏅", rarity:"EPIC",      color:"#A78BFA", glow:"rgba(167,139,250,0.45)",value:"+750 pts"   },
  { id:"xp_sm",     name:"XP Boost",          description:"Boost your experience",      emoji:"⚡", rarity:"COMMON",    color:"#9CA3AF", glow:"rgba(156,163,175,0.3)", value:"×1.5 XP 1h" },
  { id:"xp_md",     name:"Super XP Boost",    description:"Double your XP gains",       emoji:"🔥", rarity:"RARE",      color:"#22D3EE", glow:"rgba(34,211,238,0.4)",  value:"×2 XP 3h"   },
  { id:"xp_lg",     name:"Mega XP Boost",     description:"Insane XP multiplier",       emoji:"💎", rarity:"EPIC",      color:"#A78BFA", glow:"rgba(167,139,250,0.45)",value:"×3 XP 6h"   },
  { id:"vip",       name:"VIP Free Trial",     description:"Enjoy VIP perks for free",   emoji:"👑", rarity:"EPIC",      color:"#A78BFA", glow:"rgba(167,139,250,0.45)",value:"24h VIP"    },
  { id:"legend",    name:"Legendary Chest",    description:"You found the rarest prize!", emoji:"🌟", rarity:"LEGENDARY", color:"#FBBF24", glow:"rgba(251,191,36,0.55)", value:"+2000 pts"  },
  { id:"mystery",   name:"Mystery Gift",       description:"A surprise awaits…",         emoji:"🎁", rarity:"RARE",      color:"#22D3EE", glow:"rgba(34,211,238,0.4)",  value:"????"       },
  { id:"streak",    name:"Streak Shield",      description:"Protect your daily streak",   emoji:"🛡️", rarity:"COMMON",   color:"#9CA3AF", glow:"rgba(156,163,175,0.3)", value:"1× Shield"  },
  { id:"jackpot",   name:"JACKPOT!",           description:"You hit the ultimate prize!", emoji:"🎰", rarity:"LEGENDARY", color:"#FBBF24", glow:"rgba(251,191,36,0.55)", value:"+5000 pts"  },
];

const HISTORY_SEED: { reward: Reward; date: string; ago: string }[] = [
  { reward: REWARD_POOL[1], date:"Today",      ago:"2h ago"    },
  { reward: REWARD_POOL[4], date:"Yesterday",  ago:"1d ago"    },
  { reward: REWARD_POOL[7], date:"2 days ago", ago:"2d ago"    },
  { reward: REWARD_POOL[0], date:"3 days ago", ago:"3d ago"    },
  { reward: REWARD_POOL[6], date:"4 days ago", ago:"4d ago"    },
];

function pickReward(): Reward {
  const total = Object.values(RARITY_META).reduce((s, r) => s + r.weight, 0);
  let rand = Math.random() * total;
  let rarity: Rarity = "COMMON";
  for (const [key, meta] of Object.entries(RARITY_META)) {
    rand -= meta.weight;
    if (rand <= 0) { rarity = key as Rarity; break; }
  }
  const pool = REWARD_POOL.filter((r) => r.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

function pointsFromReward(r: Reward): number {
  if (r.value.startsWith("+") && r.value.endsWith(" pts")) {
    return parseInt(r.value.replace("+","").replace(" pts",""), 10);
  }
  return 0;
}

/* ─── Neon particles ─────────────────────────────────────────────────────── */
function NeonParticles() {
  const p = Array.from({ length:24 }, (_, i) => ({
    id:i, x:Math.random()*100, y:Math.random()*100,
    size:1.5+Math.random()*3,
    color: i%4===0?"#6D28D9": i%4===1?"#FBBF24": i%4===2?"#22D3EE":"#A78BFA",
    dur:3+Math.random()*4, delay:Math.random()*3,
  }));
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex:0 }}>
      {p.map((pp) => (
        <motion.div key={pp.id} className="absolute rounded-full"
          style={{ left:`${pp.x}%`, top:`${pp.y}%`, width:pp.size, height:pp.size, background:pp.color, filter:"blur(1px)" }}
          animate={{ opacity:[0.1,0.5,0.1], y:[-8,8,-8], scale:[1,1.5,1] }}
          transition={{ duration:pp.dur, delay:pp.delay, repeat:Infinity, ease:"easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Floating stars around box ─────────────────────────────────────────── */
function FloatingStars({ active }: { active: boolean }) {
  const stars = Array.from({ length:8 }, (_, i) => ({
    angle: (i/8)*360, dist: 70+Math.random()*30, size: 8+Math.random()*10,
    color: i%3===0?"#FBBF24": i%3===1?"#A78BFA":"#22D3EE",
    dur: 2+Math.random()*2, delay: i*0.15,
  }));
  return (
    <AnimatePresence>
      {active && stars.map((s, i) => {
        const rad = (s.angle * Math.PI) / 180;
        return (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left:"50%", top:"50%",
              x: Math.cos(rad)*s.dist - s.size/2,
              y: Math.sin(rad)*s.dist - s.size/2,
              width: s.size, height: s.size,
              color: s.color,
            }}
            initial={{ opacity:0, scale:0 }}
            animate={{ opacity:[0,1,0.6,1,0], scale:[0,1,0.8,1,0], rotate:[0,360] }}
            exit={{ opacity:0, scale:0 }}
            transition={{ duration: s.dur, delay: s.delay, repeat: Infinity }}
          >
            <Star size={s.size} fill={s.color} style={{ color:s.color }} />
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}

/* ─── Explosion particles ────────────────────────────────────────────────── */
function ExplosionParticles({ trigger }: { trigger: boolean }) {
  const parts = Array.from({ length:20 }, (_, i) => ({
    id:i, angle:(i/20)*360, dist:80+Math.random()*60,
    color:["#FBBF24","#A78BFA","#22D3EE","#F97316","#34D399"][i%5],
    size:4+Math.random()*6,
  }));
  return (
    <AnimatePresence>
      {trigger && parts.map((p) => {
        const rad = (p.angle*Math.PI)/180;
        return (
          <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
            style={{ left:"50%", top:"50%", width:p.size, height:p.size, background:p.color, filter:`blur(1px)` }}
            initial={{ x:0, y:0, opacity:1, scale:1 }}
            animate={{ x:Math.cos(rad)*p.dist, y:Math.sin(rad)*p.dist, opacity:0, scale:0 }}
            exit={{}}
            transition={{ duration:0.8, ease:"easeOut" }}
          />
        );
      })}
    </AnimatePresence>
  );
}

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Phase = "idle" | "shaking" | "exploding" | "revealed";

interface Props {
  onBack: () => void;
  userPoints: number;
  onPointsUpdate: (pts: number) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export function LuckyBoxPage({ onBack, userPoints, onPointsUpdate }: Props) {
  const MAX_DAILY = 3;
  const [phase, setPhase]           = useState<Phase>("idle");
  const [opensLeft, setOpensLeft]   = useState(MAX_DAILY);
  const [reward, setReward]         = useState<Reward | null>(null);
  const [history, setHistory]       = useState(HISTORY_SEED);
  const [adUsed, setAdUsed]         = useState(false);
  const [explosion, setExplosion]   = useState(false);
  const boxControls                 = useAnimation();

  const fireRewardConfetti = (rarity: Rarity) => {
    const colors =
      rarity === "LEGENDARY" ? ["#FBBF24","#F59E0B","#FDE68A","#fff"]
      : rarity === "EPIC"    ? ["#A78BFA","#7C3AED","#C4B5FD","#fff"]
      : rarity === "RARE"    ? ["#22D3EE","#0E7490","#BAE6FD","#fff"]
      : ["#9CA3AF","#6B7280","#E5E7EB","#fff"];
    const count = rarity === "LEGENDARY" ? 200 : rarity === "EPIC" ? 120 : rarity === "RARE" ? 80 : 40;
    confetti({ particleCount:count, spread:120, origin:{ x:0.5, y:0.4 }, colors });
    if (rarity === "LEGENDARY") {
      setTimeout(() => confetti({ particleCount:80, angle:60,  spread:80, origin:{ x:0, y:0.5 }, colors }), 200);
      setTimeout(() => confetti({ particleCount:80, angle:120, spread:80, origin:{ x:1, y:0.5 }, colors }), 400);
    }
  };

  const handleOpen = async () => {
    if (phase !== "idle" || opensLeft <= 0) return;

    // shake
    setPhase("shaking");
    await boxControls.start({
      rotate: [0, -8, 8, -8, 8, -6, 6, -4, 4, 0],
      scale:  [1, 1.05, 1, 1.08, 1, 1.05, 1, 1.02, 1, 1],
      transition: { duration:0.9, ease:"easeInOut" },
    });

    // explode
    setPhase("exploding");
    setExplosion(true);
    await boxControls.start({ scale:[1, 1.3, 0], opacity:[1, 1, 0], transition:{ duration:0.5 } });

    // pick reward
    const picked = pickReward();
    setReward(picked);
    setOpensLeft((n) => n - 1);

    const pts = pointsFromReward(picked);
    if (pts > 0) onPointsUpdate(userPoints + pts);

    fireRewardConfetti(picked.rarity);

    await new Promise((r) => setTimeout(r, 300));
    setPhase("revealed");
    setExplosion(false);

    // prepend to history
    setHistory((h) => [{ reward:picked, date:"Just now", ago:"now" }, ...h.slice(0,4)]);
  };

  const handleWatchAd = () => {
    if (adUsed) return;
    setAdUsed(true);
    setOpensLeft((n) => Math.min(n + 1, MAX_DAILY + 1));
  };

  const handleReset = async () => {
    await boxControls.start({ scale:0, opacity:0, transition:{ duration:0.2 } });
    setPhase("idle");
    setReward(null);
    await boxControls.start({ scale:1, opacity:1, transition:{ duration:0.35, type:"spring" } });
  };

  const rarityMeta = reward ? RARITY_META[reward.rarity] : null;

  return (
    <div className="flex flex-col gap-4 pb-2 relative">
      <NeonParticles />
      <div className="relative flex flex-col gap-4" style={{ zIndex:1 }}>

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <motion.button whileTap={{ scale:0.92 }} onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)", color:"#FBBF24", cursor:"pointer" }}>
            <ArrowLeft size={15} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.82rem" }}>Back</span>
          </motion.button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)" }}>
            <span style={{ fontSize:"0.82rem" }}>🪙</span>
            <motion.span key={userPoints} initial={{ scale:1.3, color:"#6EE7B7" }} animate={{ scale:1, color:"#FBBF24" }}
              transition={{ duration:0.4 }}
              style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.85rem", display:"inline-block" }}>
              {userPoints.toLocaleString()}
            </motion.span>
          </div>
        </div>

        {/* Section title */}
        <div className="flex items-center gap-2">
          <Gift size={18} style={{ color:"#FBBF24" }} />
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.1rem", color:"#FFF7ED", letterSpacing:"0.05em" }}>
            LUCKY BOX
          </span>
          <div className="flex items-center gap-1 ml-auto px-2.5 py-1 rounded-full"
            style={{ background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.3)" }}>
            <Clock size={11} style={{ color:"#FBBF24" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.68rem", color:"#FBBF24" }}>
              {opensLeft}/{MAX_DAILY} OPENS TODAY
            </span>
          </div>
        </div>

        {/* ── BOX ARENA ────────────────────────────────────────────────────── */}
        <div className="relative flex flex-col items-center py-6 rounded-3xl overflow-hidden"
          style={{
            background:"linear-gradient(145deg, rgba(26,16,64,0.92) 0%, rgba(10,15,30,0.95) 100%)",
            border:"1.5px solid rgba(251,191,36,0.3)",
            boxShadow:"0 0 60px rgba(251,191,36,0.15), 0 0 100px rgba(109,40,217,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
            backdropFilter:"blur(20px)",
            minHeight:260,
          }}
        >
          {/* Background glow orbs */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-25"
            style={{ background:"#6D28D9" }} />
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl opacity-20"
            style={{ background:"#FBBF24" }} />

          <AnimatePresence mode="wait">
            {/* ── IDLE / SHAKING / EXPLODING: show box ── */}
            {phase !== "revealed" && (
              <motion.div key="box" className="relative flex flex-col items-center gap-4"
                initial={{ scale:1, opacity:1 }}>

                {/* Floating stars */}
                <div className="relative" style={{ width:140, height:140 }}>
                  <FloatingStars active={phase === "idle"} />
                  <ExplosionParticles trigger={explosion} />

                  {/* The box */}
                  <motion.div
                    animate={boxControls}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.div
                      animate={phase === "idle"
                        ? { y:[0,-8,0], filter:["drop-shadow(0 0 12px #FBBF2466)","drop-shadow(0 0 28px #FBBF2499)","drop-shadow(0 0 12px #FBBF2466)"] }
                        : {}}
                      transition={{ duration:2.5, repeat:Infinity, ease:"easeInOut" }}
                      style={{ fontSize:"7rem", lineHeight:1, userSelect:"none" }}
                    >
                      🎁
                    </motion.div>
                  </motion.div>
                </div>

                {/* Rarity probability guide */}
                {phase === "idle" && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
                    className="flex gap-2 px-4">
                    {(Object.entries(RARITY_META) as [Rarity, typeof RARITY_META[Rarity]][]).map(([key, meta]) => (
                      <div key={key} className="flex flex-col items-center gap-0.5">
                        <div className="w-2 h-2 rounded-full" style={{ background:meta.color, boxShadow:`0 0 6px ${meta.color}` }} />
                        <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.52rem", color:meta.color }}>
                          {key.slice(0,3)}
                        </span>
                        <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.48rem", color:"#6B7280" }}>
                          {meta.weight}%
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}

                {phase === "shaking" && (
                  <motion.p animate={{ opacity:[1,0.4,1] }} transition={{ duration:0.4, repeat:Infinity }}
                    style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.9rem", color:"#FBBF24" }}>
                    Opening…
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* ── REVEALED: show reward ── */}
            {phase === "revealed" && reward && rarityMeta && (
              <motion.div key="reward"
                initial={{ opacity:0, y:60, scale:0.8 }}
                animate={{ opacity:1, y:0, scale:1 }}
                transition={{ type:"spring", stiffness:200, damping:18 }}
                className="flex flex-col items-center gap-4 px-6 py-2 w-full"
              >
                {/* Rarity banner */}
                <motion.div
                  animate={{ boxShadow:[`0 0 16px ${rarityMeta.color}44`,`0 0 36px ${rarityMeta.color}88`,`0 0 16px ${rarityMeta.color}44`] }}
                  transition={{ duration:1.5, repeat:Infinity }}
                  className="px-4 py-1 rounded-full"
                  style={{
                    background:`linear-gradient(90deg, ${rarityMeta.bg}, ${rarityMeta.bg})`,
                    border:`1.5px solid ${rarityMeta.color}66`,
                  }}>
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"0.75rem", color:rarityMeta.color, letterSpacing:"0.12em" }}>
                    ✦ {rarityMeta.label} ✦
                  </span>
                </motion.div>

                {/* Reward emoji */}
                <motion.div
                  animate={{ y:[0,-6,0], filter:[`drop-shadow(0 0 16px ${rarityMeta.color}66)`,`drop-shadow(0 0 40px ${rarityMeta.color}cc)`,`drop-shadow(0 0 16px ${rarityMeta.color}66)`] }}
                  transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}
                  style={{ fontSize:"5.5rem", lineHeight:1, userSelect:"none" }}
                >
                  {reward.emoji}
                </motion.div>

                {/* Name + value */}
                <div className="flex flex-col items-center gap-0.5">
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.3rem", color:rarityMeta.color, letterSpacing:"0.04em" }}>
                    {reward.name}
                  </span>
                  <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.78rem", color:"#9CA3AF" }}>
                    {reward.description}
                  </span>
                </div>

                {/* Value chip */}
                <div className="px-5 py-2 rounded-xl"
                  style={{
                    background:`linear-gradient(135deg, ${rarityMeta.bg}, rgba(0,0,0,0.3))`,
                    border:`1.5px solid ${rarityMeta.color}55`,
                    boxShadow:`0 0 24px ${rarityMeta.glow}`,
                  }}>
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.1rem", color:rarityMeta.color }}>
                    {reward.value}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── ACTIONS ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2.5">
          {phase !== "revealed" ? (
            <>
              {/* Open button */}
              <motion.button
                whileTap={{ scale:0.97 }}
                onClick={handleOpen}
                disabled={phase !== "idle" || opensLeft <= 0}
                className="flex items-center justify-center gap-2.5 py-4 rounded-2xl w-full"
                style={{
                  background: opensLeft > 0 && phase === "idle"
                    ? "linear-gradient(135deg, #92400E, #D97706, #6D28D9)"
                    : "rgba(255,255,255,0.05)",
                  border: opensLeft > 0 && phase === "idle"
                    ? "1.5px solid rgba(251,191,36,0.5)"
                    : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: opensLeft > 0 && phase === "idle"
                    ? "0 0 36px rgba(251,191,36,0.45), 0 0 60px rgba(109,40,217,0.2)"
                    : "none",
                  cursor: opensLeft > 0 && phase === "idle" ? "pointer" : "not-allowed",
                  opacity: opensLeft <= 0 ? 0.45 : 1,
                }}
              >
                <Gift size={20} style={{ color: opensLeft > 0 ? "#FBBF24" : "#6B7280" }} />
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.05rem",
                  color: opensLeft > 0 ? "#fff" : "#6B7280", letterSpacing:"0.06em" }}>
                  {opensLeft > 0 ? `OPEN LUCKY BOX (${opensLeft} LEFT)` : "NO OPENS REMAINING"}
                </span>
              </motion.button>

              {/* Watch ad button */}
              {!adUsed && (
                <motion.button
                  whileTap={{ scale:0.97 }} onClick={handleWatchAd}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl w-full"
                  style={{
                    background:"rgba(34,211,238,0.08)",
                    border:"1px solid rgba(34,211,238,0.3)",
                    cursor:"pointer",
                  }}>
                  <Eye size={15} style={{ color:"#22D3EE" }} />
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.9rem", color:"#67E8F9", letterSpacing:"0.04em" }}>
                    WATCH AD — GET +1 FREE OPEN
                  </span>
                </motion.button>
              )}
            </>
          ) : (
            <>
              {/* Open again */}
              {opensLeft > 0 ? (
                <motion.button
                  whileTap={{ scale:0.97 }} onClick={handleReset}
                  className="flex items-center justify-center gap-2.5 py-4 rounded-2xl w-full"
                  style={{
                    background:"linear-gradient(135deg, #92400E, #D97706, #6D28D9)",
                    border:"1.5px solid rgba(251,191,36,0.5)",
                    boxShadow:"0 0 36px rgba(251,191,36,0.4), 0 0 60px rgba(109,40,217,0.2)",
                    cursor:"pointer",
                  }}>
                  <Sparkles size={18} style={{ color:"#FBBF24" }} />
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.05rem", color:"#fff", letterSpacing:"0.06em" }}>
                    OPEN AGAIN ({opensLeft} LEFT)
                  </span>
                </motion.button>
              ) : (
                <div className="flex items-center justify-center gap-2 py-3.5 rounded-2xl"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <Clock size={14} style={{ color:"#6B7280" }} />
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.85rem", color:"#6B7280" }}>
                    Come back tomorrow for more opens!
                  </span>
                </div>
              )}
              {/* Back to home */}
              <motion.button
                whileTap={{ scale:0.97 }} onClick={onBack}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl w-full"
                style={{ background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.25)", cursor:"pointer" }}>
                <ArrowLeft size={15} style={{ color:"#FBBF24" }} />
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.9rem", color:"#FBBF24", letterSpacing:"0.04em" }}>
                  BACK TO HOME
                </span>
              </motion.button>
            </>
          )}
        </div>

        {/* ── REWARD HISTORY ────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} style={{ color:"#9CA3AF" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.75rem", color:"#6B7280", letterSpacing:"0.1em" }}>
              RECENT REWARDS
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {history.map((h, i) => {
              const meta = RARITY_META[h.reward.rarity];
              return (
                <motion.div key={i}
                  initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay:i*0.05 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{
                    background:"linear-gradient(135deg, rgba(10,15,30,0.85), rgba(26,16,64,0.7))",
                    border:`1px solid ${meta.color}22`,
                    backdropFilter:"blur(8px)",
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background:meta.bg, border:`1px solid ${meta.color}44` }}>
                    {h.reward.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.85rem", color:"#F0F4FF" }}>
                        {h.reward.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md"
                        style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.52rem",
                          color:meta.color, background:meta.bg, border:`1px solid ${meta.color}44`, flexShrink:0 }}>
                        {h.reward.rarity}
                      </span>
                    </div>
                    <span style={{ color:"#6B7280", fontSize:"0.68rem" }}>{h.reward.value}</span>
                  </div>
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.65rem", color:"#4B5563", flexShrink:0 }}>
                    {h.ago}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Rewards catalog */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} style={{ color:"#FBBF24" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.75rem", color:"#6B7280", letterSpacing:"0.1em" }}>
              POSSIBLE REWARDS
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {REWARD_POOL.slice(0,6).map((r) => {
              const meta = RARITY_META[r.rarity];
              return (
                <motion.div key={r.id}
                  whileTap={{ scale:0.97 }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{
                    background:"linear-gradient(135deg, rgba(10,15,30,0.85), rgba(26,16,64,0.7))",
                    border:`1px solid ${meta.color}25`,
                    backdropFilter:"blur(8px)",
                  }}>
                  <span style={{ fontSize:"1.5rem" }}>{r.emoji}</span>
                  <div className="min-w-0">
                    <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.75rem", color:"#D1D5DB", margin:0 }}>
                      {r.name}
                    </p>
                    <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.65rem", color:meta.color, margin:0 }}>
                      {r.value}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
