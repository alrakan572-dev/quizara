import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings, Edit3, Gift, Users, Crown, Zap, Trophy, Target,
  Flame, Star, Shield, TrendingUp, CheckCircle2, Lock,
  ChevronRight, Calendar, Brain, Puzzle, Clock,
} from "lucide-react";

/* ─── Static data ─────────────────────────────────────────────────────── */
const USER = {
  avatar: "🦊", name: "Alex_Quizmaster", id: "#QZ-48291",
  flag: "🇺🇸", country: "United States", vip: true,
  level: 23, xp: 48250, xpCap: 55000,
  rank: 12, totalPts: 48250,
};

const STATS = [
  { label:"Games Played",  value:"342",  icon:Brain,       color:"#22D3EE" },
  { label:"Win Rate",      value:"74%",  icon:Target,      color:"#34D399" },
  { label:"Day Streak",    value:"12",   icon:Flame,       color:"#F97316" },
  { label:"Correct Ans.",  value:"2,184",icon:CheckCircle2,color:"#A78BFA" },
  { label:"Best Score",    value:"2,850",icon:Zap,         color:"#FBBF24" },
  { label:"Global Rank",   value:"#12",  icon:Trophy,      color:"#F87171" },
];

interface Achievement {
  id: string; name: string; desc: string; emoji: string;
  color: string; unlocked: boolean; progress: number; total: number;
}
const ACHIEVEMENTS: Achievement[] = [
  { id:"champ",    name:"Champion",     desc:"Win 100 games",         emoji:"🏆", color:"#FBBF24", unlocked:true,  progress:342, total:100  },
  { id:"speed",    name:"Speed Demon",  desc:"Answer in < 3s",        emoji:"⚡", color:"#22D3EE", unlocked:true,  progress:88,  total:50   },
  { id:"fire",     name:"On Fire",      desc:"7-day streak",          emoji:"🔥", color:"#F97316", unlocked:true,  progress:12,  total:7    },
  { id:"mind",     name:"Mastermind",   desc:"Perfect score × 10",    emoji:"🧠", color:"#A78BFA", unlocked:false, progress:6,   total:10   },
  { id:"royal",    name:"Royalty",      desc:"Reach #1 globally",     emoji:"👑", color:"#FBBF24", unlocked:false, progress:12,  total:1    },
  { id:"diamond",  name:"Diamond",      desc:"100,000 total points",  emoji:"💎", color:"#22D3EE", unlocked:false, progress:48250,total:100000},
  { id:"scholar",  name:"Scholar",      desc:"Answer 2000 correctly", emoji:"📚", color:"#34D399", unlocked:true,  progress:2184,total:2000 },
  { id:"legend",   name:"Legend",       desc:"Play 500 games",        emoji:"⭐", color:"#F87171", unlocked:false, progress:342, total:500  },
  { id:"social",   name:"Social Star",  desc:"Invite 10 friends",     emoji:"🌟", color:"#A78BFA", unlocked:false, progress:3,   total:10   },
];

interface GameHistory {
  mode: string; pts: number; result: "WIN"|"LOSS"|"DRAW"; date: string; accuracy: number; icon: string;
}
const HISTORY: GameHistory[] = [
  { mode:"Riddles",           pts:450,  result:"WIN",  date:"Today, 14:32",    accuracy:90, icon:"🧩" },
  { mode:"General Knowledge", pts:600,  result:"WIN",  date:"Today, 11:15",    accuracy:80, icon:"🧠" },
  { mode:"Fastest Mode",      pts:1200, result:"WIN",  date:"Yesterday, 20:44",accuracy:100,icon:"⚡" },
  { mode:"Daily Challenge",   pts:350,  result:"LOSS", date:"Yesterday, 18:22",accuracy:50, icon:"📅" },
  { mode:"General Knowledge", pts:0,    result:"LOSS", date:"2 days ago",       accuracy:40, icon:"🧠" },
  { mode:"Riddles",           pts:250,  result:"WIN",  date:"3 days ago",       accuracy:70, icon:"🧩" },
];

type Tab = "stats" | "achievements" | "history";
const TABS: { id: Tab; label: string }[] = [
  { id:"stats",        label:"Stats"        },
  { id:"achievements", label:"Badges"       },
  { id:"history",      label:"History"      },
];

/* ─── Neon particles ─────────────────────────────────────────────────────── */
function NeonParticles() {
  const p = Array.from({ length:14 }, (_, i) => ({
    id:i, x:Math.random()*100, y:Math.random()*100,
    size:1.5+Math.random()*2.5,
    color:i%3===0?"#6D28D9":i%3===1?"#22D3EE":"#FBBF24",
    dur:3+Math.random()*4, delay:Math.random()*3,
  }));
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex:0 }}>
      {p.map((pp) => (
        <motion.div key={pp.id} className="absolute rounded-full"
          style={{ left:`${pp.x}%`, top:`${pp.y}%`, width:pp.size, height:pp.size, background:pp.color, filter:"blur(1px)" }}
          animate={{ opacity:[0.1,0.45,0.1], y:[-6,6,-6], scale:[1,1.4,1] }}
          transition={{ duration:pp.dur, delay:pp.delay, repeat:Infinity, ease:"easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Achievement badge ──────────────────────────────────────────────────── */
function AchievementBadge({ a, index }: { a: Achievement; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.min(100, Math.round((a.progress / a.total) * 100));

  return (
    <motion.button
      key={a.id}
      initial={{ opacity:0, scale:0.85 }}
      animate={{ opacity:1, scale:1 }}
      transition={{ delay:index*0.04 }}
      whileTap={{ scale:0.95 }}
      onClick={() => setExpanded((e) => !e)}
      className="flex flex-col items-center rounded-2xl py-3 px-2 relative overflow-hidden w-full"
      style={{
        background: a.unlocked
          ? `linear-gradient(145deg, ${a.color}18, rgba(10,15,30,0.85))`
          : "rgba(10,15,30,0.6)",
        border: a.unlocked ? `1px solid ${a.color}44` : "1px solid rgba(255,255,255,0.05)",
        boxShadow: a.unlocked ? `0 0 16px ${a.color}14` : "none",
        backdropFilter:"blur(8px)",
        cursor:"pointer",
        opacity: a.unlocked ? 1 : 0.55,
      }}
    >
      {/* Lock overlay for locked */}
      {!a.unlocked && (
        <div className="absolute top-1.5 right-1.5">
          <Lock size={9} style={{ color:"#4B5563" }} />
        </div>
      )}

      {/* Glow ring for unlocked */}
      {a.unlocked && (
        <motion.div
          animate={{ opacity:[0.3,0.6,0.3] }} transition={{ duration:2, repeat:Infinity }}
          className="absolute inset-0 rounded-2xl"
          style={{ border:`1px solid ${a.color}55` }}
        />
      )}

      <span style={{ fontSize:"1.6rem", filter: a.unlocked ? "none" : "grayscale(1)", marginBottom:4 }}>
        {a.emoji}
      </span>
      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.65rem",
        color: a.unlocked ? a.color : "#4B5563", textAlign:"center", lineHeight:1.2 }}>
        {a.name}
      </span>

      {/* Mini progress bar */}
      <div className="w-full mt-1.5 h-1 rounded-full" style={{ background:"rgba(255,255,255,0.07)" }}>
        <motion.div
          initial={{ width:0 }}
          animate={{ width:`${pct}%` }}
          transition={{ delay:0.3+index*0.04, duration:0.6 }}
          className="h-full rounded-full"
          style={{ background: a.unlocked ? a.color : "#374151" }}
        />
      </div>
      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.52rem",
        color: a.unlocked ? a.color : "#4B5563", marginTop:2 }}>
        {pct}%
      </span>

      {/* Expanded tooltip */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity:0, y:4, scale:0.9 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:4, scale:0.9 }}
            transition={{ duration:0.18 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl z-10 whitespace-nowrap"
            style={{
              background:"rgba(10,15,30,0.97)",
              border:`1px solid ${a.color}55`,
              boxShadow:`0 0 16px ${a.color}30`,
            }}
          >
            <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.7rem", color:a.color, margin:0 }}>
              {a.name}
            </p>
            <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.62rem", color:"#9CA3AF", margin:0 }}>
              {a.desc}
            </p>
            <p style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.6rem", color:"#6B7280", margin:0 }}>
              {a.progress.toLocaleString()} / {a.total.toLocaleString()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ─── History row ────────────────────────────────────────────────────────── */
function HistoryRow({ game, index }: { game: GameHistory; index: number }) {
  const isWin  = game.result === "WIN";
  const color  = isWin ? "#34D399" : "#F87171";
  const bgCol  = isWin ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.06)";
  return (
    <motion.div
      initial={{ opacity:0, x:-12 }}
      animate={{ opacity:1, x:0 }}
      transition={{ delay:index*0.05 }}
      className="flex items-center gap-3 px-3 py-3 rounded-xl"
      style={{
        background:`linear-gradient(135deg, ${bgCol}, rgba(10,15,30,0.8))`,
        border:`1px solid ${color}22`,
        backdropFilter:"blur(8px)",
      }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background:`${color}18`, border:`1px solid ${color}33` }}>
        {game.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.82rem", color:"#F0F4FF" }}>
            {game.mode}
          </span>
          <span className="px-1.5 py-0.5 rounded-md"
            style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.5rem",
              color, background:`${color}18`, border:`1px solid ${color}33` }}>
            {game.result}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Clock size={10} style={{ color:"#6B7280" }} />
          <span style={{ color:"#6B7280", fontSize:"0.65rem" }}>{game.date}</span>
          <span style={{ color:"#4B5563", fontSize:"0.6rem" }}>·</span>
          <Target size={10} style={{ color:"#6B7280" }} />
          <span style={{ color:"#6B7280", fontSize:"0.65rem" }}>{game.accuracy}% acc</span>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"0.9rem",
          color: isWin ? "#FBBF24" : "#4B5563" }}>
          {isWin ? `+${game.pts}` : "—"}
        </span>
        <p style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.55rem", color:"#6B7280", margin:0 }}>pts</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export function ProfilePage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("stats");
  const xpPct = Math.round((USER.xp / USER.xpCap) * 100);

  return (
    <div className="flex flex-col gap-4 pb-2 relative">
      <NeonParticles />
      <div className="relative flex flex-col gap-4" style={{ zIndex:1 }}>

        {/* Page header */}
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
          className="flex items-center justify-between">
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.2rem", color:"#F0F4FF", letterSpacing:"0.04em" }}>
            PROFILE
          </span>
          <motion.button whileTap={{ scale:0.92 }}
            onClick={() => onNavigate && onNavigate("settings")}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background:"rgba(109,40,217,0.18)", border:"1px solid rgba(109,40,217,0.35)", cursor:"pointer" }}>
            <Settings size={16} style={{ color:"#A78BFA" }} />
          </motion.button>
        </motion.div>

        {/* ── USER HERO CARD ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}
          transition={{ delay:0.05 }}
          className="relative rounded-3xl overflow-hidden"
          style={{
            background:"linear-gradient(145deg, rgba(26,16,64,0.95) 0%, rgba(10,15,30,0.95) 100%)",
            border:"1.5px solid rgba(109,40,217,0.4)",
            boxShadow:"0 0 60px rgba(109,40,217,0.2), 0 0 100px rgba(34,211,238,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
            backdropFilter:"blur(20px)",
          }}
        >
          {/* Decorative bg blobs */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background:"#6D28D9" }} />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-15" style={{ background:"#22D3EE" }} />

          {/* Top section: avatar + info */}
          <div className="relative flex items-start gap-4 p-4 pb-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <motion.div
                animate={{ boxShadow:["0 0 16px #6D28D966","0 0 36px #6D28D999","0 0 16px #6D28D966"] }}
                transition={{ duration:2.5, repeat:Infinity, ease:"easeInOut" }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background:"linear-gradient(135deg, #4C1D95, #6D28D9)",
                  fontSize:"2.6rem",
                }}
              >
                {USER.avatar}
              </motion.div>
              {/* Online dot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                style={{ background:"#111827", borderColor:"#111827" }}>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-0.5">
              {/* Name row */}
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.1rem", color:"#F0F4FF" }}>
                  {USER.name}
                </span>
                {USER.vip && (
                  <motion.span
                    animate={{ boxShadow:["0 0 6px #FBBF2466","0 0 14px #FBBF2499","0 0 6px #FBBF2466"] }}
                    transition={{ duration:2, repeat:Infinity }}
                    className="px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background:"linear-gradient(90deg, #D97706, #FBBF24)",
                      fontFamily:"'Rajdhani', sans-serif", fontWeight:800,
                      fontSize:"0.58rem", color:"#111827", letterSpacing:"0.08em",
                    }}>
                    ⭐ VIP
                  </motion.span>
                )}
              </div>

              {/* ID + Country */}
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.65rem", color:"#4B5563" }}>
                  {USER.id}
                </span>
                <span style={{ fontSize:"0.75rem" }}>{USER.flag}</span>
                <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.62rem", color:"#4B5563" }}>
                  {USER.country}
                </span>
              </div>

              {/* Level badge */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
                  style={{ background:"rgba(109,40,217,0.25)", border:"1px solid rgba(167,139,250,0.4)" }}>
                  <Shield size={11} style={{ color:"#A78BFA" }} />
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.68rem", color:"#A78BFA" }}>
                    LVL {USER.level}
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
                  style={{ background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.3)" }}>
                  <Star size={11} style={{ color:"#FBBF24" }} />
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.68rem", color:"#FBBF24" }}>
                    #{USER.rank} Global
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* XP progress */}
          <div className="relative px-4 pb-4">
            <div className="flex justify-between mb-1.5">
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.62rem", color:"#6B7280" }}>
                LEVEL {USER.level} → {USER.level + 1}
              </span>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.62rem", color:"#A78BFA" }}>
                {USER.xp.toLocaleString()} / {USER.xpCap.toLocaleString()} XP
              </span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background:"rgba(255,255,255,0.07)" }}>
              <motion.div
                initial={{ width:0 }}
                animate={{ width:`${xpPct}%` }}
                transition={{ delay:0.3, duration:0.8, ease:"easeOut" }}
                className="h-full rounded-full"
                style={{
                  background:"linear-gradient(90deg, #6D28D9, #22D3EE)",
                  boxShadow:"0 0 10px rgba(34,211,238,0.4)",
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.58rem", color:"#4B5563" }}>{xpPct}% complete</span>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.58rem", color:"#4B5563" }}>
                {(USER.xpCap - USER.xp).toLocaleString()} XP to next level
              </span>
            </div>
          </div>

          {/* Total points strip */}
          <div className="relative mx-4 mb-4 flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{
              background:"linear-gradient(135deg, rgba(251,191,36,0.15), rgba(217,119,6,0.07))",
              border:"1px solid rgba(251,191,36,0.3)",
            }}>
            <div>
              <p style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.6rem", color:"#6B7280", margin:0, letterSpacing:"0.08em" }}>
                TOTAL POINTS
              </p>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize:"1.5rem", color:"#FBBF24" }}>
                {USER.totalPts.toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize:"2.2rem" }}>🪙</div>
          </div>
        </motion.div>

        {/* ── ACTION BUTTONS ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon:Edit3,  label:"Edit Profile",     color:"#22D3EE", bg:"rgba(34,211,238,0.1)",  border:"rgba(34,211,238,0.3)",  nav:"edit-profile" },
            { icon:Gift,   label:"My Rewards",       color:"#FBBF24", bg:"rgba(251,191,36,0.1)",  border:"rgba(251,191,36,0.3)",  nav:"rewards" },
            { icon:Users,  label:"Invite Friends",   color:"#34D399", bg:"rgba(52,211,153,0.1)",  border:"rgba(52,211,153,0.3)",  nav:"invite" },
            { icon:Crown,  label:"Upgrade to VIP",   color:"#FBBF24", bg:"linear-gradient(135deg, rgba(217,119,6,0.2), rgba(251,191,36,0.1))", border:"rgba(251,191,36,0.4)", nav:"vip" },
          ].map((btn, i) => {
            const Icon = btn.icon;
            const isVip = btn.label === "Upgrade to VIP";
            const handleBtnClick = () => { if ((btn as any).nav && onNavigate) onNavigate((btn as any).nav); };
            return (
              <motion.button
                key={btn.label}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.1+i*0.05 }}
                whileTap={{ scale:0.96 }}
                onClick={handleBtnClick}
                className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl relative overflow-hidden"
                style={{
                  background: btn.bg,
                  border:`1px solid ${btn.border}`,
                  boxShadow: isVip ? "0 0 20px rgba(251,191,36,0.15)" : "none",
                  cursor:"pointer",
                }}>
                {isVip && (
                  <motion.div
                    animate={{ opacity:[0,0.4,0] }} transition={{ duration:2, repeat:Infinity }}
                    className="absolute inset-0 rounded-xl"
                    style={{ background:"linear-gradient(90deg, transparent, rgba(251,191,36,0.15), transparent)" }}
                  />
                )}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background:`${btn.color}22`, border:`1px solid ${btn.color}44` }}>
                  <Icon size={14} style={{ color:btn.color }} />
                </div>
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.8rem",
                  color:btn.color, flex:1, textAlign:"left" }}>
                  {btn.label}
                </span>
                <ChevronRight size={13} style={{ color:`${btn.color}66`, flexShrink:0 }} />
              </motion.button>
            );
          })}
        </div>

        {/* ── TABS ─────────────────────────────────────────────────────────── */}
        <div className="flex rounded-xl p-1 gap-1"
          style={{ background:"rgba(10,15,30,0.85)", border:"1px solid rgba(109,40,217,0.2)", backdropFilter:"blur(8px)" }}>
          {TABS.map((t) => (
            <motion.button key={t.id} onClick={() => setActiveTab(t.id)} whileTap={{ scale:0.96 }}
              className="flex-1 py-2 rounded-lg"
              style={{
                background: activeTab===t.id ? "linear-gradient(135deg, #4C1D95, #6D28D9)" : "transparent",
                border:"none", cursor:"pointer",
                boxShadow: activeTab===t.id ? "0 0 12px rgba(109,40,217,0.45)" : "none",
                transition:"all 0.2s",
              }}>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.75rem",
                color: activeTab===t.id ? "#fff" : "#6B7280", letterSpacing:"0.03em" }}>
                {t.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* ── TAB CONTENT ──────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            transition={{ duration:0.22 }}>

            {/* STATS */}
            {activeTab === "stats" && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {STATS.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <motion.div key={s.label}
                        initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                        transition={{ delay:i*0.05 }}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl"
                        style={{
                          background:"linear-gradient(135deg, rgba(10,15,30,0.88), rgba(26,16,64,0.7))",
                          border:`1px solid ${s.color}28`,
                          boxShadow:`0 0 16px ${s.color}0a`,
                          backdropFilter:"blur(8px)",
                        }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background:`${s.color}20`, border:`1px solid ${s.color}44` }}>
                          <Icon size={15} style={{ color:s.color }} />
                        </div>
                        <div className="min-w-0">
                          <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.05rem", color:s.color, margin:0, lineHeight:1 }}>
                            {s.value}
                          </p>
                          <p style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.6rem", color:"#6B7280", margin:0 }}>
                            {s.label}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Win rate bar */}
                <div className="rounded-2xl px-4 py-4"
                  style={{
                    background:"linear-gradient(145deg, rgba(10,15,30,0.9), rgba(26,16,64,0.8))",
                    border:"1px solid rgba(109,40,217,0.25)",
                    backdropFilter:"blur(12px)",
                  }}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} style={{ color:"#34D399" }} />
                    <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.75rem", color:"#9CA3AF", letterSpacing:"0.08em" }}>
                      PERFORMANCE OVERVIEW
                    </span>
                  </div>
                  {[
                    { label:"Win Rate",     value:74, color:"#34D399" },
                    { label:"Accuracy",     value:82, color:"#22D3EE" },
                    { label:"Completion",   value:91, color:"#A78BFA" },
                  ].map((bar) => (
                    <div key={bar.label} className="mb-3 last:mb-0">
                      <div className="flex justify-between mb-1">
                        <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.65rem", color:"#6B7280" }}>{bar.label}</span>
                        <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.65rem", color:bar.color }}>{bar.value}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background:"rgba(255,255,255,0.06)" }}>
                        <motion.div
                          initial={{ width:0 }}
                          animate={{ width:`${bar.value}%` }}
                          transition={{ delay:0.2, duration:0.7, ease:"easeOut" }}
                          className="h-full rounded-full"
                          style={{ background:`linear-gradient(90deg, #6D28D9, ${bar.color})`, boxShadow:`0 0 8px ${bar.color}55` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Streak calendar strip */}
                <div className="rounded-2xl px-4 py-3"
                  style={{
                    background:"linear-gradient(135deg, rgba(249,115,22,0.12), rgba(10,15,30,0.9))",
                    border:"1px solid rgba(249,115,22,0.25)",
                    backdropFilter:"blur(8px)",
                  }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Flame size={14} style={{ color:"#F97316" }} />
                      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#FB923C" }}>
                        12-DAY STREAK
                      </span>
                    </div>
                    <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.62rem", color:"#6B7280" }}>
                      Best: 28 days
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length:14 }, (_, i) => {
                      const active = i >= 2;
                      return (
                        <div key={i} className="flex-1 h-6 rounded-md flex items-center justify-center"
                          style={{
                            background: active ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.04)",
                            border: active ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(255,255,255,0.05)",
                          }}>
                          <Flame size={10} style={{ color: active ? "#F97316" : "#374151" }} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-1 mt-0.5">
                    {["M","T","W","T","F","S","S","M","T","W","T","F","S","S"].map((d, i) => (
                      <div key={i} className="flex-1 flex items-center justify-center">
                        <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.48rem", color:"#374151" }}>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ACHIEVEMENTS */}
            {activeTab === "achievements" && (
              <div className="flex flex-col gap-3">
                {/* Summary */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background:"rgba(10,15,30,0.8)", border:"1px solid rgba(109,40,217,0.2)", backdropFilter:"blur(8px)" }}>
                  <div className="flex items-center gap-2">
                    <Trophy size={14} style={{ color:"#FBBF24" }} />
                    <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.75rem", color:"#9CA3AF" }}>
                      UNLOCKED
                    </span>
                  </div>
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1rem", color:"#FBBF24" }}>
                    {ACHIEVEMENTS.filter((a) => a.unlocked).length} / {ACHIEVEMENTS.length}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {ACHIEVEMENTS.map((a, i) => <AchievementBadge key={a.id} a={a} index={i} />)}
                </div>

                <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.68rem", color:"#4B5563", textAlign:"center" }}>
                  Tap a badge to see details
                </p>
              </div>
            )}

            {/* HISTORY */}
            {activeTab === "history" && (
              <div className="flex flex-col gap-2">
                {/* Summary strip */}
                <div className="grid grid-cols-3 gap-2 mb-1">
                  {[
                    { label:"Total Wins",  value:"253", color:"#34D399" },
                    { label:"Total Loss",  value:"89",  color:"#F87171" },
                    { label:"Total Pts",   value:"48K", color:"#FBBF24" },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col items-center py-2.5 rounded-xl"
                      style={{ background:"rgba(10,15,30,0.8)", border:`1px solid ${s.color}22`, backdropFilter:"blur(6px)" }}>
                      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1rem", color:s.color }}>
                        {s.value}
                      </span>
                      <span style={{ color:"#6B7280", fontSize:"0.58rem" }}>{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={13} style={{ color:"#6B7280" }} />
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.7rem", color:"#6B7280", letterSpacing:"0.08em" }}>
                    RECENT GAMES
                  </span>
                </div>

                {HISTORY.map((g, i) => <HistoryRow key={i} game={g} index={i} />)}

                <motion.button whileTap={{ scale:0.97 }}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl mt-1"
                  style={{ background:"rgba(109,40,217,0.1)", border:"1px solid rgba(109,40,217,0.25)", cursor:"pointer" }}>
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.8rem", color:"#A78BFA" }}>
                    View Full History
                  </span>
                  <ChevronRight size={13} style={{ color:"#A78BFA" }} />
                </motion.button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
