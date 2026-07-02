import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Copy, Share2, Check, Users, Gift,
  Crown, Star, Zap, ChevronRight, Link2, Trophy,
} from "lucide-react";
import confetti from "canvas-confetti";

/* ─── Data ──────────────────────────────────────────────────────────────── */
const REFERRAL_CODE = "QUIZORA-AX48291";
const REFERRAL_URL  = "https://t.me/QuizoraBot?start=AX48291";

const INVITED_FRIENDS = [
  { name:"Sarah_Q",      avatar:"🌸", date:"2 days ago",  pts:500, active:true  },
  { name:"Mike_Brainz",  avatar:"🎮", date:"5 days ago",  pts:500, active:true  },
  { name:"TomQuiz",      avatar:"🤖", date:"1 week ago",  pts:500, active:true  },
];

const MILESTONES = [
  { count:1,  reward:"500 Bonus Points",   icon:"🪙", color:"#34D399", done:true  },
  { count:3,  reward:"1,500 + Lucky Box",  icon:"🎁", color:"#22D3EE", done:true  },
  { count:5,  reward:"XP Boost × 2 (3h)", icon:"⚡", color:"#F97316", done:false, progress:3, total:5 },
  { count:10, reward:"VIP Free 7 Days",    icon:"👑", color:"#FBBF24", done:false, progress:3, total:10 },
  { count:25, reward:"LEGEND Badge",       icon:"🌟", color:"#A78BFA", done:false, progress:3, total:25 },
];

const TOP_INVITERS = [
  { rank:1, name:"QuizKing_99",    avatar:"👑", invited:48, flag:"🇺🇸", color:"#FBBF24" },
  { rank:2, name:"BrainStorm_X",  avatar:"🦅", invited:41, flag:"🇬🇧", color:"#9CA3AF" },
  { rank:3, name:"MindMaster",    avatar:"🐉", invited:37, flag:"🇯🇵", color:"#CD7F32" },
  { rank:4, name:"NeoGenius",     avatar:"🦊", invited:29, flag:"🇩🇪", color:"#6B7280" },
  { rank:5, name:"SwiftThinker",  avatar:"⚡", invited:22, flag:"🇫🇷", color:"#6B7280" },
  { rank:6, name:"PuzzleWiz",     avatar:"🧩", invited:19, flag:"🇰🇷", color:"#6B7280" },
  { rank:7, name:"Alex_Quizmaster",avatar:"🦊",invited:3, flag:"🇺🇸", color:"#A78BFA", isMe:true },
];

/* ─── Particles ─────────────────────────────────────────────────────────── */
function NeonParticles() {
  const p = Array.from({ length:18 }, (_, i) => ({
    id:i, x:Math.random()*100, y:Math.random()*100, size:1.5+Math.random()*2.5,
    color:i%3===0?"#6D28D9":i%3===1?"#22D3EE":"#FBBF24",
    dur:3+Math.random()*4, delay:Math.random()*3,
  }));
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex:0 }}>
      {p.map((pp) => (
        <motion.div key={pp.id} className="absolute rounded-full"
          style={{ left:`${pp.x}%`, top:`${pp.y}%`, width:pp.size, height:pp.size, background:pp.color, filter:"blur(1px)" }}
          animate={{ opacity:[0.08,0.5,0.08], y:[-8,8,-8], scale:[1,1.5,1] }}
          transition={{ duration:pp.dur, delay:pp.delay, repeat:Infinity, ease:"easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Floating gift ─────────────────────────────────────────────────────── */
function FloatingGift() {
  return (
    <div className="relative flex items-center justify-center" style={{ height:110 }}>
      {[70, 92, 114].map((size, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width:size, height:size, border:`1px solid rgba(109,40,217,${0.18 - i*0.04})` }}
          animate={{ scale:[1,1.1,1], opacity:[0.25,0.55,0.25] }}
          transition={{ duration:2.4+i*0.4, repeat:Infinity, ease:"easeInOut", delay:i*0.3 }}
        />
      ))}
      <motion.div
        animate={{ y:[0,-7,0], filter:["drop-shadow(0 0 12px #6D28D988)","drop-shadow(0 0 28px #6D28D9cc)","drop-shadow(0 0 12px #6D28D988)"] }}
        transition={{ duration:2.2, repeat:Infinity, ease:"easeInOut" }}
        className="relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{
          background:"linear-gradient(145deg, rgba(109,40,217,0.45), rgba(34,211,238,0.3))",
          border:"2px solid rgba(109,40,217,0.6)",
          boxShadow:"0 0 32px rgba(109,40,217,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
          fontSize:"2.6rem",
        }}
      >
        🎁
      </motion.div>
    </div>
  );
}

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Props { onBack: () => void; userPoints: number; onPointsUpdate: (pts: number) => void; }

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════════ */
export function InviteFriendsPage({ onBack, userPoints, onPointsUpdate }: Props) {
  const [codeCopied, setCodeCopied]   = useState(false);
  const [linkCopied, setLinkCopied]   = useState(false);
  const [shareBurst, setShareBurst]   = useState(false);
  const invitedCount = INVITED_FRIENDS.length;
  const totalEarned  = invitedCount * 500;

  const handleCopyCode = () => {
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCopyLink = () => {
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShare = () => {
    setShareBurst(true);
    setTimeout(() => setShareBurst(false), 1400);
    confetti({ particleCount:70, spread:90, origin:{ x:0.5, y:0.5 },
      colors:["#6D28D9","#22D3EE","#FBBF24","#A78BFA","#34D399"] });
  };

  return (
    <div className="flex flex-col gap-4 pb-2 relative">
      <NeonParticles />
      <div className="relative flex flex-col gap-4" style={{ zIndex:1 }}>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
          className="flex items-center justify-between">
          <motion.button whileTap={{ scale:0.92 }} onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background:"rgba(109,40,217,0.15)", border:"1px solid rgba(109,40,217,0.35)", color:"#A78BFA", cursor:"pointer" }}>
            <ArrowLeft size={15} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.82rem" }}>Back</span>
          </motion.button>
          <div className="flex items-center gap-1.5">
            <Users size={16} style={{ color:"#A78BFA" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1rem", color:"#F0F4FF", letterSpacing:"0.04em" }}>
              INVITE FRIENDS
            </span>
          </div>
          <div style={{ width:64 }} />
        </motion.div>

        {/* ── HERO CARD ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.04 }}
          className="relative rounded-3xl overflow-hidden flex flex-col items-center px-5 pb-5"
          style={{
            background:"linear-gradient(145deg, rgba(26,16,64,0.97) 0%, rgba(10,15,30,0.97) 100%)",
            border:"1.5px solid rgba(109,40,217,0.38)",
            boxShadow:"0 0 60px rgba(109,40,217,0.2), 0 0 80px rgba(34,211,238,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter:"blur(20px)",
          }}
        >
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-56 h-28 rounded-full blur-3xl opacity-25"
            style={{ background:"radial-gradient(ellipse, #6D28D9 0%, #22D3EE 100%)" }} />

          <FloatingGift />

          <div className="flex flex-col items-center gap-1.5 relative text-center">
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize:"1.35rem",
              background:"linear-gradient(90deg, #A78BFA, #22D3EE)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"0.04em" }}>
              INVITE & EARN TOGETHER
            </span>
            <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.8rem", color:"#9CA3AF",
              lineHeight:1.6, maxWidth:270, margin:0 }}>
              Invite your friends to Quizora and earn <strong style={{ color:"#FBBF24" }}>500 points</strong> for every friend who joins and plays their first game.
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-3 mt-4 w-full">
            {[
              { label:"Friends Invited", value:invitedCount,          icon:"👥", color:"#22D3EE" },
              { label:"Points Earned",   value:`${totalEarned.toLocaleString()}`, icon:"🪙", color:"#FBBF24" },
              { label:"Next Milestone",  value:`${invitedCount}/5`,    icon:"🎯", color:"#F97316" },
            ].map((s) => (
              <div key={s.label} className="flex-1 flex flex-col items-center py-2.5 rounded-xl gap-0.5"
                style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${s.color}25` }}>
                <span style={{ fontSize:"1rem" }}>{s.icon}</span>
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"0.95rem", color:s.color }}>
                  {s.value}
                </span>
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.52rem", color:"#6B7280", textAlign:"center" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── REFERRAL CODE ────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Link2 size={13} style={{ color:"#A78BFA" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#6B7280", letterSpacing:"0.1em" }}>
              YOUR REFERRAL CODE
            </span>
          </div>

          {/* Code box */}
          <motion.div
            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl mb-2"
            style={{
              background:"linear-gradient(135deg, rgba(109,40,217,0.2), rgba(10,15,30,0.9))",
              border:"1.5px solid rgba(109,40,217,0.45)",
              boxShadow:"0 0 24px rgba(109,40,217,0.15)",
              backdropFilter:"blur(12px)",
            }}
          >
            <span className="flex-1" style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800,
              fontSize:"1.05rem", color:"#A78BFA", letterSpacing:"0.12em" }}>
              {REFERRAL_CODE}
            </span>
            <motion.button
              whileTap={{ scale:0.92 }}
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{
                background: codeCopied ? "rgba(52,211,153,0.2)" : "rgba(109,40,217,0.3)",
                border: `1px solid ${codeCopied ? "rgba(52,211,153,0.5)" : "rgba(167,139,250,0.4)"}`,
                cursor:"pointer", transition:"all 0.2s",
              }}
            >
              <AnimatePresence mode="wait">
                {codeCopied
                  ? <motion.span key="check" initial={{ scale:0 }} animate={{ scale:1 }}>
                      <Check size={13} style={{ color:"#34D399" }} />
                    </motion.span>
                  : <motion.span key="copy" initial={{ scale:0 }} animate={{ scale:1 }}>
                      <Copy size={13} style={{ color:"#A78BFA" }} />
                    </motion.span>
                }
              </AnimatePresence>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem",
                color: codeCopied ? "#34D399" : "#A78BFA" }}>
                {codeCopied ? "Copied!" : "Copy"}
              </span>
            </motion.button>
          </motion.div>

          {/* Referral link */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-2"
            style={{ background:"rgba(10,15,30,0.75)", border:"1px solid rgba(255,255,255,0.06)", backdropFilter:"blur(6px)" }}>
            <span className="flex-1 truncate" style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.72rem", color:"#6B7280" }}>
              {REFERRAL_URL}
            </span>
            <motion.button whileTap={{ scale:0.92 }} onClick={handleCopyLink}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
              style={{ background: linkCopied ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.07)",
                border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer" }}>
              <AnimatePresence mode="wait">
                {linkCopied
                  ? <motion.div key="y" initial={{ scale:0 }} animate={{ scale:1 }}><Check size={11} style={{ color:"#34D399" }} /></motion.div>
                  : <motion.div key="n" initial={{ scale:0 }} animate={{ scale:1 }}><Copy size={11} style={{ color:"#9CA3AF" }} /></motion.div>
                }
              </AnimatePresence>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.6rem",
                color: linkCopied ? "#34D399" : "#9CA3AF" }}>
                {linkCopied ? "Copied" : "Copy"}
              </span>
            </motion.button>
          </div>

          {/* Share button */}
          <div className="relative">
            <AnimatePresence>
              {shareBurst && (
                <motion.div
                  initial={{ opacity:0, y:0, scale:0.6 }}
                  animate={{ opacity:1, y:-28, scale:1 }}
                  exit={{ opacity:0, y:-50, scale:0.8 }}
                  transition={{ duration:0.5 }}
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{ zIndex:50 }}
                >
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl"
                    style={{ background:"rgba(109,40,217,0.3)", border:"1px solid rgba(167,139,250,0.5)",
                      boxShadow:"0 0 20px rgba(109,40,217,0.4)" }}>
                    <Zap size={13} style={{ color:"#A78BFA" }} />
                    <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.82rem", color:"#A78BFA" }}>
                      Link Shared!
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              whileTap={{ scale:0.97 }} onClick={handleShare}
              className="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl w-full relative overflow-hidden"
              style={{
                background:"linear-gradient(135deg, #4C1D95, #6D28D9, #0E47A1)",
                border:"1.5px solid rgba(167,139,250,0.45)",
                boxShadow:"0 0 32px rgba(109,40,217,0.45), 0 0 60px rgba(34,211,238,0.1)",
                cursor:"pointer",
              }}
            >
              <motion.div animate={{ x:["-100%","200%"] }} transition={{ duration:2.5, repeat:Infinity, ease:"linear" }}
                className="absolute inset-0"
                style={{ background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", width:"40%" }} />
              <Share2 size={17} style={{ color:"#22D3EE" }} />
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1rem", color:"#fff", letterSpacing:"0.05em" }}>
                SHARE YOUR INVITE LINK
              </span>
            </motion.button>
          </div>
        </div>

        {/* ── MILESTONE REWARDS ────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Gift size={13} style={{ color:"#FBBF24" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#6B7280", letterSpacing:"0.1em" }}>
              MILESTONE REWARDS
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {MILESTONES.map((m, i) => {
              const prog = m.done ? 100 : Math.round(((m.progress ?? 0) / (m.total ?? 1)) * 100);
              return (
                <motion.div key={m.count}
                  initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl relative overflow-hidden"
                  style={{
                    background: m.done
                      ? `linear-gradient(135deg, ${m.color}1a, rgba(10,15,30,0.85))`
                      : "rgba(10,15,30,0.75)",
                    border: m.done ? `1px solid ${m.color}44` : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: m.done ? `0 0 16px ${m.color}18` : "none",
                    backdropFilter:"blur(8px)",
                  }}>
                  {/* Progress fill bg */}
                  {!m.done && (
                    <div className="absolute left-0 top-0 h-full rounded-xl"
                      style={{ width:`${prog}%`, background:  `${m.color}0a`, transition:"width 0.6s ease" }} />
                  )}

                  <div className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ background:`${m.color}22`, border:`1px solid ${m.color}44` }}>
                    {m.icon}
                    {m.done && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background:"#34D399", border:"1.5px solid #111827" }}>
                        <Check size={8} style={{ color:"#111827" }} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 relative">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.8rem",
                        color: m.done ? m.color : "#F0F4FF" }}>
                        {m.count} Friend{m.count > 1 ? "s" : ""}
                      </span>
                      {m.done && (
                        <span className="px-1.5 py-0.5 rounded-md"
                          style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.5rem",
                            color:"#34D399", background:"rgba(52,211,153,0.15)", border:"1px solid rgba(52,211,153,0.3)" }}>
                          CLAIMED
                        </span>
                      )}
                    </div>
                    <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.72rem", color:"#9CA3AF" }}>
                      {m.reward}
                    </span>
                    {!m.done && (
                      <div className="mt-1 w-full h-1 rounded-full" style={{ background:"rgba(255,255,255,0.07)" }}>
                        <motion.div
                          initial={{ width:0 }}
                          animate={{ width:`${prog}%` }}
                          transition={{ delay:0.3+i*0.05, duration:0.7 }}
                          className="h-full rounded-full"
                          style={{ background:m.color }}
                        />
                      </div>
                    )}
                  </div>

                  {!m.done && (
                    <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.68rem",
                      color:m.color, flexShrink:0 }}>
                      {m.progress}/{m.total}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── INVITED FRIENDS ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Users size={13} style={{ color:"#22D3EE" }} />
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#6B7280", letterSpacing:"0.1em" }}>
                YOUR INVITED FRIENDS ({invitedCount})
              </span>
            </div>
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.65rem", color:"#FBBF24" }}>
              +{totalEarned.toLocaleString()} pts total
            </span>
          </div>

          {INVITED_FRIENDS.length > 0 ? (
            <div className="flex flex-col gap-2">
              {INVITED_FRIENDS.map((f, i) => (
                <motion.div key={f.name}
                  initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.06 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background:"rgba(10,15,30,0.8)", border:"1px solid rgba(34,211,238,0.15)", backdropFilter:"blur(6px)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                    style={{ background:"rgba(34,211,238,0.12)", border:"1px solid rgba(34,211,238,0.3)" }}>
                    {f.avatar}
                  </div>
                  <div className="flex-1">
                    <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.85rem", color:"#F0F4FF" }}>
                      {f.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.62rem", color:"#6B7280" }}>Active · {f.date}</span>
                    </div>
                  </div>
                  <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.82rem", color:"#FBBF24" }}>
                    +{f.pts}
                  </span>
                </motion.div>
              ))}

              {/* Invite more CTA */}
              <motion.button whileTap={{ scale:0.97 }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
                style={{ background:"rgba(34,211,238,0.07)", border:"1px dashed rgba(34,211,238,0.25)", cursor:"pointer" }}>
                <Users size={14} style={{ color:"#22D3EE" }} />
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.8rem", color:"#22D3EE" }}>
                  Invite more friends →
                </span>
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 gap-2 rounded-2xl"
              style={{ background:"rgba(10,15,30,0.6)", border:"1px dashed rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize:"2rem" }}>👥</span>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.8rem", color:"#4B5563" }}>
                No friends invited yet. Be the first!
              </span>
            </div>
          )}
        </div>

        {/* ── TOP INVITERS LEADERBOARD ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Trophy size={13} style={{ color:"#FBBF24" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#6B7280", letterSpacing:"0.1em" }}>
              TOP INVITERS
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden"
            style={{
              background:"linear-gradient(145deg, rgba(10,15,30,0.9), rgba(26,16,64,0.8))",
              border:"1px solid rgba(109,40,217,0.22)",
              backdropFilter:"blur(12px)",
            }}>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-2"
              style={{ background:"rgba(109,40,217,0.12)", borderBottom:"1px solid rgba(109,40,217,0.15)" }}>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.62rem", color:"#6B7280", flex:1 }}>PLAYER</span>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.62rem", color:"#6B7280" }}>INVITED</span>
            </div>

            {TOP_INVITERS.map((player, i) => {
              const medalEmoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
              return (
                <motion.div key={player.name}
                  initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.04 }}
                  className="flex items-center gap-2.5 px-4 py-2.5"
                  style={{
                    background: player.isMe ? "rgba(109,40,217,0.15)" : "transparent",
                    borderBottom: i < TOP_INVITERS.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    borderLeft: player.isMe ? "2px solid rgba(167,139,250,0.5)" : "2px solid transparent",
                  }}>
                  <div className="w-5 flex items-center justify-center flex-shrink-0">
                    {medalEmoji
                      ? <span style={{ fontSize:"0.9rem" }}>{medalEmoji}</span>
                      : <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#4B5563" }}>
                          #{player.rank}
                        </span>
                    }
                  </div>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                    style={{ background:`${player.color}20`, border:`1px solid ${player.color}44` }}>
                    {player.avatar}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.82rem",
                      color: player.isMe ? "#A78BFA" : "#D1D5DB",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {player.name}
                    </span>
                    {player.isMe && (
                      <span className="px-1.5 py-0.5 rounded-md flex-shrink-0"
                        style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.48rem",
                          color:"#6D28D9", background:"rgba(109,40,217,0.2)", border:"1px solid rgba(109,40,217,0.35)" }}>
                        YOU
                      </span>
                    )}
                    <span style={{ fontSize:"0.65rem", flexShrink:0 }}>{player.flag}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={10} style={{ color:player.color }} />
                    <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.78rem", color:player.color }}>
                      {player.invited}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl px-4 py-4"
          style={{
            background:"linear-gradient(145deg, rgba(10,15,30,0.88), rgba(26,16,64,0.7))",
            border:"1px solid rgba(109,40,217,0.22)",
            backdropFilter:"blur(8px)",
          }}>
          <div className="flex items-center gap-2 mb-3">
            <Star size={13} style={{ color:"#FBBF24" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#6B7280", letterSpacing:"0.1em" }}>
              HOW IT WORKS
            </span>
          </div>
          {[
            { step:"1", text:"Share your referral code or link with friends",    icon:"🔗", color:"#A78BFA" },
            { step:"2", text:"Your friend joins Quizora and plays their 1st game",icon:"🎮", color:"#22D3EE" },
            { step:"3", text:"You both earn 500 points instantly",               icon:"🪙", color:"#FBBF24" },
            { step:"4", text:"Unlock VIP rewards after 10 successful invites",   icon:"👑", color:"#F97316" },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-3 mb-3 last:mb-0">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background:`${s.color}22`, border:`1px solid ${s.color}44` }}>
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"0.65rem", color:s.color }}>
                  {s.step}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <span style={{ fontSize:"1rem", flexShrink:0 }}>{s.icon}</span>
                <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.75rem", color:"#9CA3AF", lineHeight:1.5 }}>
                  {s.text}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
