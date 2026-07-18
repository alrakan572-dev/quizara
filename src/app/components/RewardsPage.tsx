import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Gift, Star, Crown, Zap, Trophy,
  Lock, ChevronRight, Clock,
  Sparkles, Calendar, TrendingUp,
} from "lucide-react";
import confetti from "canvas-confetti";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Badge {
  id: string; name: string; desc: string; emoji: string;
  xp: number; color: string; glow: string; unlocked: boolean;
  progress: number; total: number; rarity: "Common"|"Rare"|"Epic"|"Legendary";
}
interface Category { id: string; label: string; icon: typeof Star; color: string; badges: Badge[]; }

/* ─── Badge data ─────────────────────────────────────────────────────────── */
const CATEGORIES: Category[] = [
  {
    id:"beginner", label:"Beginner", icon:Star, color:"#34D399",
    badges:[
      { id:"first_game",  name:"First Steps",    desc:"Play your first game",         emoji:"🎮", xp:50,  color:"#34D399", glow:"rgba(52,211,153,0.45)",  unlocked:true,  progress:1,   total:1,   rarity:"Common"    },
      { id:"first_win",   name:"First Victory",  desc:"Win your first quiz",          emoji:"🏆", xp:100, color:"#34D399", glow:"rgba(52,211,153,0.45)",  unlocked:true,  progress:1,   total:1,   rarity:"Common"    },
      { id:"profile_up",  name:"Identity",       desc:"Complete your profile",        emoji:"👤", xp:75,  color:"#34D399", glow:"rgba(52,211,153,0.45)",  unlocked:true,  progress:1,   total:1,   rarity:"Common"    },
      { id:"games_10",    name:"Warming Up",     desc:"Play 10 games",                emoji:"🎯", xp:150, color:"#34D399", glow:"rgba(52,211,153,0.45)",  unlocked:true,  progress:10,  total:10,  rarity:"Common"    },
      { id:"games_50",    name:"Getting Serious",desc:"Play 50 games",                emoji:"💪", xp:300, color:"#22D3EE", glow:"rgba(34,211,238,0.4)",   unlocked:true,  progress:50,  total:50,  rarity:"Rare"      },
      { id:"games_100",   name:"Veteran",        desc:"Play 100 games",               emoji:"🎖️",xp:500, color:"#22D3EE", glow:"rgba(34,211,238,0.4)",   unlocked:true,  progress:100, total:100, rarity:"Rare"      },
    ],
  },
  {
    id:"quizmaster", label:"Quiz Master", icon:Trophy, color:"#FBBF24",
    badges:[
      { id:"perfect_1",   name:"Perfectionist",  desc:"Get a perfect score",          emoji:"💯", xp:200, color:"#FBBF24", glow:"rgba(251,191,36,0.5)",   unlocked:true,  progress:1,   total:1,   rarity:"Rare"      },
      { id:"perfect_10",  name:"Mastermind",     desc:"Get 10 perfect scores",        emoji:"🧠", xp:600, color:"#A78BFA", glow:"rgba(167,139,250,0.45)", unlocked:false, progress:6,   total:10,  rarity:"Epic"      },
      { id:"acc_90",      name:"Sharp Mind",     desc:"Maintain 90%+ accuracy",       emoji:"🎯", xp:400, color:"#FBBF24", glow:"rgba(251,191,36,0.5)",   unlocked:true,  progress:1,   total:1,   rarity:"Rare"      },
      { id:"scholar",     name:"Scholar",        desc:"Answer 2,000 correctly",       emoji:"📚", xp:800, color:"#22D3EE", glow:"rgba(34,211,238,0.4)",   unlocked:true,  progress:2184,total:2000,rarity:"Epic"      },
      { id:"trivia_god",  name:"Trivia God",     desc:"Answer 10,000 correctly",      emoji:"⚡", xp:2000,color:"#FBBF24", glow:"rgba(251,191,36,0.6)",   unlocked:false, progress:2184,total:10000,rarity:"Legendary" },
      { id:"all_cats",    name:"Polymath",       desc:"Win in every category",        emoji:"🌍", xp:1000,color:"#A78BFA", glow:"rgba(167,139,250,0.45)", unlocked:false, progress:5,   total:8,   rarity:"Epic"      },
    ],
  },
  {
    id:"speedking", label:"Speed King", icon:Zap, color:"#F97316",
    badges:[
      { id:"fast_1",      name:"Quick Draw",     desc:"Answer in under 3 seconds",    emoji:"⚡", xp:100, color:"#F97316", glow:"rgba(249,115,22,0.45)",  unlocked:true,  progress:1,   total:1,   rarity:"Common"    },
      { id:"fast_50",     name:"Speed Demon",    desc:"50 lightning-fast answers",    emoji:"🔥", xp:400, color:"#F97316", glow:"rgba(249,115,22,0.45)",  unlocked:true,  progress:88,  total:50,  rarity:"Rare"      },
      { id:"lightning",   name:"Lightning",      desc:"300pts in Fastest Mode",       emoji:"🌩️",xp:300, color:"#22D3EE", glow:"rgba(34,211,238,0.4)",   unlocked:true,  progress:1,   total:1,   rarity:"Rare"      },
      { id:"combo5",      name:"Combo King",     desc:"5× combo in Fastest Mode",     emoji:"💥", xp:500, color:"#F97316", glow:"rgba(249,115,22,0.45)",  unlocked:false, progress:3,   total:5,   rarity:"Epic"      },
      { id:"sub2",        name:"Sub-Second",     desc:"Answer in under 2s × 10",      emoji:"🚀", xp:800, color:"#A78BFA", glow:"rgba(167,139,250,0.45)", unlocked:false, progress:4,   total:10,  rarity:"Epic"      },
      { id:"speed_god",   name:"Speed God",      desc:"Max score in Fastest Mode",    emoji:"🏎️",xp:1500,color:"#FBBF24", glow:"rgba(251,191,36,0.6)",   unlocked:false, progress:0,   total:1,   rarity:"Legendary" },
    ],
  },
  {
    id:"daily", label:"Daily Champion", icon:Calendar, color:"#A78BFA",
    badges:[
      { id:"streak_3",    name:"Consistent",     desc:"3-day login streak",           emoji:"🔥", xp:50,  color:"#A78BFA", glow:"rgba(167,139,250,0.4)",  unlocked:true,  progress:3,   total:3,   rarity:"Common"    },
      { id:"streak_7",    name:"On Fire",         desc:"7-day login streak",           emoji:"🌟", xp:150, color:"#A78BFA", glow:"rgba(167,139,250,0.4)",  unlocked:true,  progress:12,  total:7,   rarity:"Common"    },
      { id:"streak_30",   name:"Dedicated",      desc:"30-day login streak",          emoji:"💎", xp:500, color:"#22D3EE", glow:"rgba(34,211,238,0.4)",   unlocked:false, progress:12,  total:30,  rarity:"Rare"      },
      { id:"daily_5",     name:"Daily Grinder",  desc:"Complete 5 daily challenges",  emoji:"📅", xp:200, color:"#A78BFA", glow:"rgba(167,139,250,0.4)",  unlocked:true,  progress:5,   total:5,   rarity:"Common"    },
      { id:"daily_30",    name:"Champion",       desc:"Complete 30 daily challenges", emoji:"🏅", xp:700, color:"#FBBF24", glow:"rgba(251,191,36,0.5)",   unlocked:false, progress:18,  total:30,  rarity:"Epic"      },
      { id:"perfect_week",name:"Perfect Week",   desc:"Perfect score every day × 7",  emoji:"🎗️",xp:1000,color:"#FBBF24", glow:"rgba(251,191,36,0.6)",   unlocked:false, progress:2,   total:7,   rarity:"Legendary" },
    ],
  },
  {
    id:"lucky", label:"Lucky Winner", icon:Gift, color:"#F87171",
    badges:[
      { id:"lucky_1",     name:"Lucky One",      desc:"Open your first Lucky Box",    emoji:"🎁", xp:50,  color:"#F87171", glow:"rgba(248,113,113,0.4)",  unlocked:true,  progress:1,   total:1,   rarity:"Common"    },
      { id:"lucky_10",    name:"Fortune Seeker", desc:"Open 10 Lucky Boxes",          emoji:"🎰", xp:200, color:"#F87171", glow:"rgba(248,113,113,0.4)",  unlocked:true,  progress:10,  total:10,  rarity:"Common"    },
      { id:"lucky_rare",  name:"Rare Find",      desc:"Win a Rare reward",            emoji:"💫", xp:150, color:"#22D3EE", glow:"rgba(34,211,238,0.4)",   unlocked:true,  progress:1,   total:1,   rarity:"Rare"      },
      { id:"lucky_epic",  name:"Epic Luck",      desc:"Win an Epic reward",           emoji:"✨", xp:400, color:"#A78BFA", glow:"rgba(167,139,250,0.45)", unlocked:false, progress:0,   total:1,   rarity:"Epic"      },
      { id:"lucky_leg",   name:"Jackpot!",       desc:"Win a Legendary reward",       emoji:"🌈", xp:1000,color:"#FBBF24", glow:"rgba(251,191,36,0.6)",   unlocked:false, progress:0,   total:1,   rarity:"Legendary" },
      { id:"lucky_50",    name:"Box Hoarder",    desc:"Open 50 Lucky Boxes",          emoji:"🎀", xp:600, color:"#F87171", glow:"rgba(248,113,113,0.4)",  unlocked:false, progress:10,  total:50,  rarity:"Epic"      },
    ],
  },
  {
    id:"leaderboard", label:"Top Leaderboard", icon:Crown, color:"#FBBF24",
    badges:[
      { id:"top100",      name:"On the Board",   desc:"Enter the Top 100",            emoji:"📊", xp:300, color:"#22D3EE", glow:"rgba(34,211,238,0.4)",   unlocked:true,  progress:1,   total:1,   rarity:"Rare"      },
      { id:"top50",       name:"Rising Star",    desc:"Reach the Top 50",             emoji:"⭐", xp:500, color:"#22D3EE", glow:"rgba(34,211,238,0.4)",   unlocked:true,  progress:1,   total:1,   rarity:"Rare"      },
      { id:"top10",       name:"Elite",          desc:"Reach the Top 10",             emoji:"💎", xp:1000,color:"#A78BFA", glow:"rgba(167,139,250,0.45)", unlocked:false, progress:12,  total:10,  rarity:"Epic"      },
      { id:"top1",        name:"Legend",         desc:"Reach #1 globally",            emoji:"👑", xp:5000,color:"#FBBF24", glow:"rgba(251,191,36,0.65)",  unlocked:false, progress:12,  total:1,   rarity:"Legendary" },
      { id:"weekly_top",  name:"Weekly Hero",    desc:"Top 3 in weekly ranking",      emoji:"🏅", xp:600, color:"#F97316", glow:"rgba(249,115,22,0.45)",  unlocked:false, progress:0,   total:3,   rarity:"Epic"      },
      { id:"friends_top", name:"Social King",    desc:"#1 in friends ranking",        emoji:"👥", xp:400, color:"#34D399", glow:"rgba(52,211,153,0.4)",   unlocked:false, progress:3,   total:1,   rarity:"Rare"      },
    ],
  },
];

const RARITY_META = {
  Common:    { color:"#9CA3AF", label:"COMMON"    },
  Rare:      { color:"#22D3EE", label:"RARE"      },
  Epic:      { color:"#A78BFA", label:"EPIC"      },
  Legendary: { color:"#FBBF24", label:"LEGENDARY" },
};

/* ─── Reward summary data ────────────────────────────────────────────────── */
const REWARD_SUMMARY = [
  { label:"Total Earned",    value:"48,250",  icon:"🪙",  color:"#FBBF24", sub:"all time"        },
  { label:"Daily Rewards",   value:"1,200",   icon:"📅",  color:"#34D399", sub:"this week"       },
  { label:"Lucky Box",       value:"3,850",   icon:"🎁",  color:"#F87171", sub:"total"           },
  { label:"VIP Bonus",       value:"9,600",   icon:"👑",  color:"#A78BFA", sub:"accumulated"     },
];

const RECENT_REWARDS = [
  { emoji:"⚡", name:"Speed Bonus",    pts:"+300",  date:"Today, 14:32",     color:"#F97316" },
  { emoji:"📅", name:"Daily Reward",   pts:"+200",  date:"Today, 09:00",     color:"#34D399" },
  { emoji:"🎁", name:"Lucky Box",      pts:"+350",  date:"Yesterday, 20:11", color:"#F87171" },
  { emoji:"🏆", name:"Win Bonus",      pts:"+150",  date:"Yesterday, 17:44", color:"#FBBF24" },
  { emoji:"👑", name:"VIP Multiplier", pts:"+450",  date:"2 days ago",       color:"#A78BFA" },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function pct(p: number, t: number) { return Math.min(100, Math.round((p / t) * 100)); }

function allBadges() { return CATEGORIES.flatMap((c) => c.badges); }
function totalXP()   { return allBadges().filter((b) => b.unlocked).reduce((s, b) => s + b.xp, 0); }
function maxXP()     { return allBadges().reduce((s, b) => s + b.xp, 0); }

/* ─── Gold particles ─────────────────────────────────────────────────────── */
function GoldParticles() {
  const pts = Array.from({ length:20 }, (_, i) => ({
    id:i, x:Math.random()*100, y:Math.random()*100, size:1.5+Math.random()*2.5,
    color:i%4===0?"#FBBF24":i%4===1?"#A78BFA":i%4===2?"#22D3EE":"#F97316",
    dur:3+Math.random()*4, delay:Math.random()*3,
  }));
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex:0 }}>
      {pts.map((p) => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size, background:p.color, filter:"blur(1px)" }}
          animate={{ opacity:[0.08,0.5,0.08], y:[-8,8,-8], scale:[1,1.5,1] }}
          transition={{ duration:p.dur, delay:p.delay, repeat:Infinity, ease:"easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Badge card ─────────────────────────────────────────────────────────── */
function BadgeCard({ badge, onClaim }: { badge: Badge; onClaim: (b: Badge) => void }) {
  const [showTip, setShowTip] = useState(false);
  const prog = pct(badge.progress, badge.total);
  const rarityColor = RARITY_META[badge.rarity].color;

  return (
    <motion.button
      initial={{ opacity:0, scale:0.82 }}
      animate={{ opacity:1, scale:1 }}
      whileTap={{ scale:0.94 }}
      onClick={() => {
        setShowTip((s) => !s);
        if (badge.unlocked && prog >= 100) onClaim(badge);
      }}
      className="relative flex flex-col items-center rounded-2xl py-3 px-2 overflow-visible w-full"
      style={{
        background: badge.unlocked
          ? `linear-gradient(145deg, ${badge.color}1a, rgba(10,15,30,0.88))`
          : "rgba(10,15,30,0.65)",
        border: badge.unlocked
          ? `1px solid ${badge.color}55`
          : "1px solid rgba(255,255,255,0.05)",
        boxShadow: badge.unlocked
          ? `0 0 20px ${badge.glow.replace("0.45","0.15")}`
          : "none",
        backdropFilter:"blur(8px)",
        cursor:"pointer",
        opacity: badge.unlocked ? 1 : 0.52,
      }}
    >
      {/* Lock icon */}
      {!badge.unlocked && (
        <div className="absolute top-1.5 right-1.5">
          <Lock size={9} style={{ color:"#4B5563" }} />
        </div>
      )}

      {/* Rarity dot */}
      <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full"
        style={{ background:rarityColor, boxShadow:`0 0 4px ${rarityColor}` }} />

      {/* Glow ring on unlocked */}
      {badge.unlocked && (
        <motion.div
          animate={{ opacity:[0.25,0.6,0.25] }} transition={{ duration:2.2, repeat:Infinity }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ border:`1px solid ${badge.color}` }}
        />
      )}

      {/* Emoji */}
      <motion.span
        animate={badge.unlocked
          ? { filter:[`drop-shadow(0 0 4px ${badge.color}88)`,`drop-shadow(0 0 12px ${badge.color}cc)`,`drop-shadow(0 0 4px ${badge.color}88)`] }
          : {}}
        transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}
        style={{ fontSize:"1.65rem", filter: badge.unlocked ? undefined : "grayscale(1) brightness(0.4)", marginBottom:3 }}
      >
        {badge.emoji}
      </motion.span>

      {/* Name */}
      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.62rem",
        color: badge.unlocked ? badge.color : "#374151", textAlign:"center", lineHeight:1.2, paddingLeft:2, paddingRight:2 }}>
        {badge.name}
      </span>

      {/* XP chip */}
      <div className="mt-1.5 px-1.5 py-0.5 rounded-md"
        style={{ background: badge.unlocked ? `${badge.color}22` : "rgba(255,255,255,0.04)",
          border:`1px solid ${badge.unlocked ? badge.color+"44" : "rgba(255,255,255,0.06)"}` }}>
        <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.52rem",
          color: badge.unlocked ? badge.color : "#374151" }}>
          +{badge.xp} XP
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full mt-1.5 h-1 rounded-full" style={{ background:"rgba(255,255,255,0.07)" }}>
        <motion.div
          initial={{ width:0 }}
          animate={{ width:`${prog}%` }}
          transition={{ delay:0.2, duration:0.7 }}
          className="h-full rounded-full"
          style={{ background: badge.unlocked ? badge.color : "#374151" }}
        />
      </div>
      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.5rem",
        color: badge.unlocked ? badge.color : "#374151", marginTop:2 }}>
        {badge.progress.toLocaleString()}/{badge.total.toLocaleString()}
      </span>

      {/* Tooltip */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity:0, y:-4, scale:0.88 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-4, scale:0.88 }}
            transition={{ duration:0.18 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl whitespace-nowrap"
            style={{
              background:"rgba(8,12,24,0.98)",
              border:`1px solid ${badge.color}55`,
              boxShadow:`0 0 20px ${badge.color}30`,
              pointerEvents:"none",
            }}
          >
            <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.7rem", color:badge.color, margin:0 }}>
              {badge.name}
            </p>
            <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.6rem", color:"#9CA3AF", margin:0 }}>
              {badge.desc}
            </p>
            <p style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.58rem", color:rarityColor, margin:0 }}>
              {RARITY_META[badge.rarity].label} · +{badge.xp} XP
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Props { onBack: () => void; userPoints: number; }

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════════ */
export function RewardsPage({ onBack }: Props) {
  const [activeCat, setActiveCat] = useState("all");
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

  const handleClaim = (badge: Badge) => {
    if (claimedIds.has(badge.id)) return;
    setClaimedIds((s) => new Set([...s, badge.id]));
    confetti({ particleCount:60, spread:80, origin:{ x:0.5, y:0.4 },
      colors:["#FBBF24","#A78BFA","#22D3EE","#F97316","#34D399"] });
  };

  const earned    = totalXP();
  const max       = maxXP();
  const overallPct = pct(earned, max);
  const unlockedCount = allBadges().filter((b) => b.unlocked).length;
  const totalCount    = allBadges().length;

  const displayedCats = activeCat === "all"
    ? CATEGORIES
    : CATEGORIES.filter((c) => c.id === activeCat);

  return (
    <div className="flex flex-col gap-4 pb-2 relative">
      <GoldParticles />
      <div className="relative flex flex-col gap-4" style={{ zIndex:1 }}>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
          className="flex items-center justify-between">
          <motion.button whileTap={{ scale:0.92 }} onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)", color:"#FBBF24", cursor:"pointer" }}>
            <ArrowLeft size={15} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.82rem" }}>Back</span>
          </motion.button>
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} style={{ color:"#FBBF24" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1rem", color:"#F0F4FF", letterSpacing:"0.04em" }}>
              REWARDS & ACHIEVEMENTS
            </span>
          </div>
          <div style={{ width:64 }} />
        </motion.div>

        {/* ── OVERALL PROGRESS HERO ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.05 }}
          className="relative rounded-3xl overflow-hidden px-5 py-5"
          style={{
            background:"linear-gradient(145deg, rgba(26,16,64,0.97) 0%, rgba(10,15,30,0.97) 100%)",
            border:"1.5px solid rgba(251,191,36,0.32)",
            boxShadow:"0 0 60px rgba(251,191,36,0.12), 0 0 80px rgba(109,40,217,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter:"blur(20px)",
          }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background:"#FBBF24" }} />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-15" style={{ background:"#6D28D9" }} />

          <div className="relative flex items-center gap-4">
            {/* Circular progress */}
            <div className="relative flex-shrink-0 w-20 h-20">
              <svg className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                <motion.circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="url(#progressGrad)" strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 34}
                  initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - overallPct/100) }}
                  transition={{ delay:0.4, duration:1, ease:"easeOut" }}
                />
                <defs>
                  <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6D28D9" />
                    <stop offset="100%" stopColor="#FBBF24" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize:"1.05rem", color:"#FBBF24", lineHeight:1 }}>
                  {overallPct}%
                </span>
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.5rem", color:"#6B7280" }}>DONE</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Trophy size={14} style={{ color:"#FBBF24" }} />
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#9CA3AF", letterSpacing:"0.08em" }}>
                  ACHIEVEMENT PROGRESS
                </span>
              </div>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize:"1.25rem", color:"#F0F4FF" }}>
                {unlockedCount} <span style={{ color:"#6B7280", fontSize:"0.8rem" }}>/ {totalCount} badges</span>
              </span>
              <div className="mt-2">
                <div className="flex justify-between mb-1">
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.6rem", color:"#6B7280" }}>Total XP Earned</span>
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.6rem", color:"#FBBF24" }}>
                    {earned.toLocaleString()} / {max.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ background:"rgba(255,255,255,0.07)" }}>
                  <motion.div
                    initial={{ width:0 }}
                    animate={{ width:`${overallPct}%` }}
                    transition={{ delay:0.3, duration:0.9, ease:"easeOut" }}
                    className="h-full rounded-full"
                    style={{ background:"linear-gradient(90deg, #6D28D9, #FBBF24)", boxShadow:"0 0 8px rgba(251,191,36,0.4)" }}
                  />
                </div>
              </div>

              {/* Rarity breakdown */}
              <div className="flex items-center gap-2 mt-2">
                {(Object.entries(RARITY_META) as [string, typeof RARITY_META[keyof typeof RARITY_META]][]).map(([key, meta]) => {
                  const count = allBadges().filter((b) => b.rarity === key && b.unlocked).length;
                  const tot   = allBadges().filter((b) => b.rarity === key).length;
                  return (
                    <div key={key} className="flex items-center gap-0.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background:meta.color }} />
                      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.52rem", color:meta.color }}>
                        {count}/{tot}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── REWARD SUMMARY ───────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Gift size={13} style={{ color:"#FBBF24" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#6B7280", letterSpacing:"0.1em" }}>
              REWARDS SUMMARY
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {REWARD_SUMMARY.map((r, i) => (
              <motion.div key={r.label}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08+i*0.05 }}
                className="flex items-center gap-2.5 px-3 py-3 rounded-xl"
                style={{
                  background:"linear-gradient(135deg, rgba(10,15,30,0.88), rgba(26,16,64,0.7))",
                  border:`1px solid ${r.color}25`,
                  boxShadow:`0 0 14px ${r.color}08`,
                  backdropFilter:"blur(8px)",
                }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ background:`${r.color}20`, border:`1px solid ${r.color}44` }}>
                  {r.icon}
                </div>
                <div className="min-w-0">
                  <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize:"1rem", color:r.color, margin:0, lineHeight:1 }}>
                    {r.value}
                  </p>
                  <p style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.58rem", color:"#6B7280", margin:0 }}>
                    {r.label}
                  </p>
                  <p style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.52rem", color:"#374151", margin:0 }}>
                    {r.sub}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── RECENT REWARDS ───────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Clock size={13} style={{ color:"#9CA3AF" }} />
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#6B7280", letterSpacing:"0.1em" }}>
                RECENT REWARDS
              </span>
            </div>
            <button style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.65rem", color:"#A78BFA",
              background:"none", border:"none", cursor:"pointer" }}>
              View all →
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {RECENT_REWARDS.map((r, i) => (
              <motion.div key={i}
                initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl"
                style={{ background:"rgba(10,15,30,0.75)", border:"1px solid rgba(255,255,255,0.05)", backdropFilter:"blur(6px)" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                  style={{ background:`${r.color}18`, border:`1px solid ${r.color}33` }}>
                  {r.emoji}
                </div>
                <span className="flex-1" style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.78rem", color:"#D1D5DB" }}>
                  {r.name}
                </span>
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.82rem", color:r.color }}>
                  {r.pts}
                </span>
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.58rem", color:"#4B5563", minWidth:72, textAlign:"right" }}>
                  {r.date}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── ACHIEVEMENTS ─────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star size={13} style={{ color:"#FBBF24" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#6B7280", letterSpacing:"0.1em" }}>
              ACHIEVEMENTS
            </span>
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth:"none" }}>
            <style>{`.cat-scroll::-webkit-scrollbar{display:none}`}</style>
            {[{ id:"all", label:"All", color:"#F0F4FF" }, ...CATEGORIES.map((c) => ({ id:c.id, label:c.label, color:c.color }))].map((cat) => {
              const active = activeCat === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale:0.95 }}
                  onClick={() => setActiveCat(cat.id)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl"
                  style={{
                    background: active ? `${cat.color}22` : "rgba(10,15,30,0.7)",
                    border: active ? `1px solid ${cat.color}66` : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: active ? `0 0 12px ${cat.color}30` : "none",
                    cursor:"pointer", transition:"all 0.2s",
                  }}>
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.68rem",
                    color: active ? cat.color : "#6B7280", whiteSpace:"nowrap" }}>
                    {cat.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Badge grids by category */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCat}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.22 }}
              className="flex flex-col gap-5"
            >
              {displayedCats.map((cat) => {
                const CatIcon = cat.icon;
                const catUnlocked = cat.badges.filter((b) => b.unlocked).length;
                return (
                  <div key={cat.id}>
                    {/* Category header */}
                    <div className="flex items-center justify-between mb-2.5 px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background:`${cat.color}22`, border:`1px solid ${cat.color}44` }}>
                          <CatIcon size={13} style={{ color:cat.color }} />
                        </div>
                        <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.82rem", color:cat.color }}>
                          {cat.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1 rounded-full" style={{ background:"rgba(255,255,255,0.07)" }}>
                          <div className="h-full rounded-full" style={{
                            width:`${pct(catUnlocked, cat.badges.length)}%`,
                            background:cat.color,
                          }} />
                        </div>
                        <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.6rem", color:cat.color }}>
                          {catUnlocked}/{cat.badges.length}
                        </span>
                      </div>
                    </div>

                    {/* Badge grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {cat.badges.map((badge, i) => (
                        <motion.div key={badge.id}
                          initial={{ opacity:0, scale:0.85 }}
                          animate={{ opacity:1, scale:1 }}
                          transition={{ delay:i*0.04 }}>
                          <BadgeCard badge={badge} onClaim={handleClaim} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── XP LEADERBOARD TEASER ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="rounded-2xl px-4 py-4 flex items-center justify-between"
          style={{
            background:"linear-gradient(135deg, rgba(109,40,217,0.2), rgba(10,15,30,0.9))",
            border:"1px solid rgba(109,40,217,0.35)",
            boxShadow:"0 0 24px rgba(109,40,217,0.1)",
            backdropFilter:"blur(12px)",
          }}>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <TrendingUp size={13} style={{ color:"#A78BFA" }} />
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#A78BFA" }}>
                XP RANKING
              </span>
            </div>
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize:"1rem", color:"#F0F4FF" }}>
              You're in the Top <span style={{ color:"#FBBF24" }}>15%</span> of XP earners
            </span>
          </div>
          <button className="flex items-center gap-1 px-3 py-2 rounded-xl"
            style={{ background:"rgba(109,40,217,0.25)", border:"1px solid rgba(167,139,250,0.4)", cursor:"pointer" }}>
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#A78BFA" }}>View</span>
            <ChevronRight size={12} style={{ color:"#A78BFA" }} />
          </button>
        </motion.div>

      </div>
    </div>
  );
}
