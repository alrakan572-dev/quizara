import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Crown, Shield, TrendingUp, TrendingDown, Minus, Star, Zap, Trophy, Globe, Users, Calendar, ChevronUp } from "lucide-react";

/* ─── Data ──────────────────────────────────────────────────────────────── */
interface Player {
  rank: number; name: string; pts: number; avatar: string;
  flag: string; country: string; vip: boolean; badge?: string;
  change: "up" | "down" | "same"; delta?: number; isMe?: boolean;
  streak: number; accuracy: number;
}

const GLOBAL: Player[] = [
  { rank:1,  name:"QuizKing_99",      pts:124500, avatar:"👑", flag:"🇺🇸", country:"USA",     vip:true,  badge:"LEGEND",  change:"same", streak:45, accuracy:96 },
  { rank:2,  name:"BrainStorm_X",     pts:118200, avatar:"🦅", flag:"🇬🇧", country:"UK",      vip:true,  badge:"LEGEND",  change:"up",   delta:1,   streak:32, accuracy:94 },
  { rank:3,  name:"MindMaster",       pts:105800, avatar:"🐉", flag:"🇯🇵", country:"Japan",   vip:true,  badge:"PRO",     change:"down", delta:1,   streak:21, accuracy:91 },
  { rank:4,  name:"NeoGenius",        pts:98400,  avatar:"🦊", flag:"🇩🇪", country:"Germany", vip:true,  badge:"PRO",     change:"up",   delta:2,   streak:18, accuracy:89 },
  { rank:5,  name:"SwiftThinker",     pts:91200,  avatar:"⚡", flag:"🇫🇷", country:"France",  vip:false, badge:"VIP",     change:"same", streak:14, accuracy:87 },
  { rank:6,  name:"PuzzleWiz",        pts:84600,  avatar:"🧩", flag:"🇰🇷", country:"Korea",   vip:true,  badge:"VIP",     change:"up",   delta:3,   streak:22, accuracy:85 },
  { rank:7,  name:"CryptoSage",       pts:77300,  avatar:"🔮", flag:"🇧🇷", country:"Brazil",  vip:false, change:"down",  delta:2,       streak:9,  accuracy:83 },
  { rank:8,  name:"StarGazer7",       pts:71000,  avatar:"🌟", flag:"🇨🇦", country:"Canada",  vip:false, change:"up",    delta:1,       streak:11, accuracy:81 },
  { rank:9,  name:"TechNinja",        pts:65800,  avatar:"🥷", flag:"🇮🇳", country:"India",   vip:false, change:"same",  streak:7,      accuracy:79 },
  { rank:10, name:"AlphaQuery",       pts:61200,  avatar:"🎯", flag:"🇦🇺", country:"Australia",vip:false,change:"down",  delta:1,       streak:5,  accuracy:77 },
  { rank:11, name:"IronMind",         pts:58100,  avatar:"🦁", flag:"🇪🇸", country:"Spain",   vip:false, change:"up",    delta:2,       streak:8,  accuracy:76 },
  { rank:12, name:"Alex_Quizmaster",  pts:48250,  avatar:"🦊", flag:"🇺🇸", country:"USA",     vip:true,  badge:"VIP",     change:"up",   delta:3,   streak:12, accuracy:74, isMe:true },
];

const WEEKLY: Player[] = [
  { rank:1, name:"SwiftThinker",    pts:12400, avatar:"⚡", flag:"🇫🇷", country:"France",  vip:false, change:"up",   delta:4, streak:7,  accuracy:91 },
  { rank:2, name:"PuzzleWiz",       pts:11200, avatar:"🧩", flag:"🇰🇷", country:"Korea",   vip:true,  change:"up",   delta:1, streak:6,  accuracy:89 },
  { rank:3, name:"NeoGenius",       pts:10800, avatar:"🦊", flag:"🇩🇪", country:"Germany", vip:true,  change:"down", delta:2, streak:5,  accuracy:87 },
  { rank:4, name:"StarGazer7",      pts:9900,  avatar:"🌟", flag:"🇨🇦", country:"Canada",  vip:false, change:"up",   delta:2, streak:4,  accuracy:85 },
  { rank:5, name:"Alex_Quizmaster", pts:8750,  avatar:"🦊", flag:"🇺🇸", country:"USA",     vip:true,  badge:"VIP",    change:"up",  delta:3, streak:12, accuracy:74, isMe:true },
];

const MONTHLY: Player[] = [
  { rank:1,  name:"MindMaster",       pts:68400, avatar:"🐉", flag:"🇯🇵", country:"Japan",   vip:true, change:"up",   delta:2, streak:21, accuracy:91 },
  { rank:2,  name:"QuizKing_99",      pts:65200, avatar:"👑", flag:"🇺🇸", country:"USA",     vip:true, change:"down", delta:1, streak:45, accuracy:96 },
  { rank:3,  name:"BrainStorm_X",     pts:61800, avatar:"🦅", flag:"🇬🇧", country:"UK",      vip:true, change:"same",          streak:32, accuracy:94 },
  { rank:4,  name:"NeoGenius",        pts:58200, avatar:"🦊", flag:"🇩🇪", country:"Germany", vip:true, change:"up",   delta:1, streak:18, accuracy:89 },
  { rank:5,  name:"Alex_Quizmaster",  pts:32100, avatar:"🦊", flag:"🇺🇸", country:"USA",     vip:true, badge:"VIP",   change:"up", delta:4, streak:12, accuracy:74, isMe:true },
];

const FRIENDS: Player[] = [
  { rank:1, name:"Sarah_Q",         pts:62400, avatar:"🌸", flag:"🇺🇸", country:"USA",   vip:true, change:"same",          streak:15, accuracy:88 },
  { rank:2, name:"Mike_Brainz",     pts:54100, avatar:"🎮", flag:"🇬🇧", country:"UK",    vip:false,change:"up",   delta:1, streak:10, accuracy:84 },
  { rank:3, name:"Alex_Quizmaster", pts:48250, avatar:"🦊", flag:"🇺🇸", country:"USA",   vip:true, badge:"VIP",   change:"down", delta:1, streak:12, accuracy:74, isMe:true },
  { rank:4, name:"TomQuiz",         pts:38600, avatar:"🤖", flag:"🇦🇺", country:"Australia",vip:false,change:"same",        streak:6,  accuracy:72 },
  { rank:5, name:"LunaStars",       pts:29200, avatar:"🌙", flag:"🇫🇷", country:"France",vip:false, change:"up",   delta:2, streak:4,  accuracy:68 },
];

type Tab = "global" | "weekly" | "monthly" | "friends";
const TABS: { id: Tab; label: string; icon: typeof Globe }[] = [
  { id:"global",  label:"Global",  icon:Globe    },
  { id:"weekly",  label:"Weekly",  icon:Zap      },
  { id:"monthly", label:"Monthly", icon:Calendar },
  { id:"friends", label:"Friends", icon:Users    },
];
const DATA: Record<Tab, Player[]> = { global:GLOBAL, weekly:WEEKLY, monthly:MONTHLY, friends:FRIENDS };

const MEDAL = ["#FBBF24","#9CA3AF","#CD7F32"];

/* ─── Neon particles ─────────────────────────────────────────────────────── */
function NeonParticles() {
  const p = Array.from({ length:16 }, (_, i) => ({
    id:i, x:Math.random()*100, y:Math.random()*100, size:1.5+Math.random()*2.5,
    color:i%3===0?"#6D28D9":i%3===1?"#FBBF24":"#22D3EE",
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

/* ─── Podium card ────────────────────────────────────────────────────────── */
function PodiumCard({ player, height, isTop }: { player: Player; height: number; isTop?: boolean }) {
  const color = MEDAL[player.rank - 1];
  return (
    <div className="flex flex-col items-center" style={{ flex: isTop ? 1.15 : 1 }}>
      {isTop && (
        <motion.div
          animate={{ y:[0,-4,0], filter:["drop-shadow(0 0 8px #FBBF24aa)","drop-shadow(0 0 18px #FBBF24ff)","drop-shadow(0 0 8px #FBBF24aa)"] }}
          transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}
        >
          <Crown size={20} style={{ color:"#FBBF24" }} />
        </motion.div>
      )}

      {/* Avatar circle */}
      <motion.div
        animate={isTop ? { boxShadow:[`0 0 16px ${color}66`,`0 0 32px ${color}99`,`0 0 16px ${color}66`] } : {}}
        transition={{ duration:2, repeat:Infinity }}
        className="rounded-2xl flex items-center justify-center mb-1.5 mt-1"
        style={{
          width: isTop ? 52 : 42, height: isTop ? 52 : 42,
          background:`linear-gradient(135deg, ${color}33, ${color}11)`,
          border:`1.5px solid ${color}66`,
          fontSize: isTop ? "1.7rem" : "1.35rem",
        }}
      >
        {player.avatar}
      </motion.div>

      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.62rem", color:"#D1D5DB",
        textAlign:"center", maxWidth:72, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {player.name}
      </span>
      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.68rem", color, marginTop:1 }}>
        {(player.pts/1000).toFixed(1)}k
      </span>
      <span style={{ fontSize:"0.7rem", marginTop:1 }}>{player.flag}</span>

      {/* Podium block */}
      <div className="w-full rounded-t-xl flex items-center justify-center mt-2"
        style={{
          height, background:`linear-gradient(180deg, ${color}28, ${color}0a)`,
          border:`1px solid ${color}44`, borderBottom:"none",
        }}>
        <motion.span
          animate={{ opacity:[0.6,1,0.6] }} transition={{ duration:2, repeat:Infinity }}
          style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize: isTop ? "1.5rem" : "1.2rem", color }}>
          #{player.rank}
        </motion.span>
      </div>
    </div>
  );
}

/* ─── Rank row ───────────────────────────────────────────────────────────── */
function RankRow({ player, index }: { player: Player; index: number }) {
  const isTop3 = player.rank <= 3;
  const color  = isTop3 ? MEDAL[player.rank-1] : player.isMe ? "#A78BFA" : undefined;

  return (
    <motion.div
      initial={{ opacity:0, x:-14 }}
      animate={{ opacity:1, x:0 }}
      transition={{ delay:index*0.04 }}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
      style={{
        background: player.isMe
          ? "linear-gradient(135deg, rgba(109,40,217,0.22), rgba(109,40,217,0.1))"
          : "linear-gradient(135deg, rgba(10,15,30,0.85), rgba(26,16,64,0.65))",
        border: player.isMe ? "1px solid rgba(109,40,217,0.5)" : "1px solid rgba(255,255,255,0.05)",
        boxShadow: player.isMe ? "0 0 16px rgba(109,40,217,0.18)" : "none",
        backdropFilter:"blur(8px)",
      }}
    >
      {/* Rank */}
      <div className="flex items-center justify-center flex-shrink-0" style={{ width:26 }}>
        {isTop3
          ? <span style={{ fontSize:"1rem" }}>{["🥇","🥈","🥉"][player.rank-1]}</span>
          : <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.82rem", color: color ?? "#6B7280" }}>
              #{player.rank}
            </span>
        }
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-lg"
        style={{
          background: color ? `${color}22` : "rgba(109,40,217,0.15)",
          border:`1px solid ${color ? color+"44" : "rgba(109,40,217,0.25)"}`,
        }}>
        {player.avatar}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.85rem",
            color: player.isMe ? "#A78BFA" : "#F0F4FF",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:110 }}>
            {player.name}
          </span>
          {player.isMe && (
            <span className="px-1.5 py-0.5 rounded-md flex-shrink-0"
              style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.5rem", color:"#6D28D9", background:"rgba(109,40,217,0.2)", border:"1px solid rgba(109,40,217,0.35)" }}>
              YOU
            </span>
          )}
          {player.vip && !player.isMe && (
            <span className="px-1.5 py-0.5 rounded-md flex-shrink-0"
              style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.5rem", color:"#FBBF24", background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.3)" }}>
              {player.badge ?? "VIP"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize:"0.6rem" }}>{player.flag}</span>
          <span style={{ color:"#FBBF24", fontSize:"0.72rem", fontFamily:"'Rajdhani', sans-serif", fontWeight:700 }}>
            {player.pts.toLocaleString()}
          </span>
          <span style={{ color:"#4B5563", fontSize:"0.6rem" }}>pts</span>
          <span style={{ color:"#374151", fontSize:"0.58rem" }}>· {player.accuracy}% acc</span>
        </div>
      </div>

      {/* Change indicator */}
      <div className="flex-shrink-0">
        {player.change === "up"   && <div className="flex items-center gap-0.5"><TrendingUp  size={12} style={{ color:"#34D399" }} />{player.delta && <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.55rem", color:"#34D399" }}>+{player.delta}</span>}</div>}
        {player.change === "down" && <div className="flex items-center gap-0.5"><TrendingDown size={12} style={{ color:"#F87171" }} />{player.delta && <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.55rem", color:"#F87171" }}>-{player.delta}</span>}</div>}
        {player.change === "same" && <Minus size={12} style={{ color:"#6B7280" }} />}
      </div>
    </motion.div>
  );
}

/* ─── Sticky user card ───────────────────────────────────────────────────── */
function StickyUserCard({ player, tab }: { player: Player | undefined; tab: Tab }) {
  if (!player) return null;
  const nextRankPts = player.pts + 8200;  // simulated gap
  const progress    = (player.pts / nextRankPts) * 100;

  return (
    <motion.div
      initial={{ y:80, opacity:0 }}
      animate={{ y:0, opacity:1 }}
      transition={{ type:"spring", stiffness:220, damping:22 }}
      className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full px-4"
      style={{ maxWidth:430, zIndex:30 }}
    >
      <div className="rounded-2xl px-4 py-3 relative overflow-hidden"
        style={{
          background:"linear-gradient(135deg, rgba(26,16,64,0.97) 0%, rgba(10,15,30,0.97) 100%)",
          border:"1.5px solid rgba(109,40,217,0.5)",
          boxShadow:"0 0 40px rgba(109,40,217,0.3), 0 -8px 32px rgba(0,0,0,0.5)",
          backdropFilter:"blur(20px)",
        }}>
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-25" style={{ background:"#6D28D9" }} />
        <div className="flex items-center gap-3 relative">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background:"rgba(109,40,217,0.3)", border:"1px solid rgba(167,139,250,0.4)" }}>
            {player.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.85rem", color:"#A78BFA" }}>
                {player.name}
              </span>
              <span className="px-1.5 py-0.5 rounded-md"
                style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.5rem", color:"#FBBF24", background:"rgba(251,191,36,0.15)", border:"1px solid rgba(251,191,36,0.35)" }}>
                VIP
              </span>
            </div>
            {/* Progress to next rank */}
            <div className="flex justify-between mb-1">
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.58rem", color:"#6B7280" }}>
                Progress to #{player.rank - 1}
              </span>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.58rem", color:"#A78BFA" }}>
                {player.pts.toLocaleString()} / {nextRankPts.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background:"rgba(255,255,255,0.07)" }}>
              <motion.div
                animate={{ width:`${progress}%` }}
                transition={{ duration:0.6, ease:"easeOut" }}
                className="h-full rounded-full"
                style={{ background:"linear-gradient(90deg, #6D28D9, #A78BFA)", boxShadow:"0 0 6px rgba(167,139,250,0.5)" }}
              />
            </div>
          </div>
          {/* Rank badge */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center px-3 py-1.5 rounded-xl"
            style={{ background:"rgba(109,40,217,0.2)", border:"1px solid rgba(109,40,217,0.4)" }}>
            <ChevronUp size={11} style={{ color:"#34D399" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1rem", color:"#A78BFA" }}>
              #{player.rank}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("global");
  const players    = DATA[activeTab];
  const top3       = players.slice(0, 3);
  const rest       = players.slice(3);
  const me         = players.find((p) => p.isMe);
  const myGlobal   = GLOBAL.find((p) => p.isMe)!;

  return (
    <div className="flex flex-col gap-4 pb-36 relative">
      <NeonParticles />
      <div className="relative flex flex-col gap-4" style={{ zIndex:1 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Trophy size={20} style={{ color:"#FBBF24" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.3rem", color:"#FFF7ED", letterSpacing:"0.04em" }}>
              LEADERBOARD
            </span>
          </div>
          {/* My global rank chip */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background:"rgba(109,40,217,0.18)", border:"1px solid rgba(109,40,217,0.4)" }}>
            <Shield size={12} style={{ color:"#A78BFA" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.78rem", color:"#A78BFA" }}>
              My Rank: #{myGlobal.rank}
            </span>
          </div>
        </motion.div>

        {/* Tab bar */}
        <div className="flex rounded-xl p-1 gap-1"
          style={{ background:"rgba(10,15,30,0.85)", border:"1px solid rgba(109,40,217,0.2)", backdropFilter:"blur(8px)" }}>
          {TABS.map((t) => {
            const Icon    = t.icon;
            const active  = activeTab === t.id;
            return (
              <motion.button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                whileTap={{ scale:0.96 }}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg"
                style={{
                  background: active ? "linear-gradient(135deg, #4C1D95, #6D28D9)" : "transparent",
                  border:"none", cursor:"pointer",
                  boxShadow: active ? "0 0 12px rgba(109,40,217,0.5)" : "none",
                  transition:"all 0.2s",
                }}>
                <Icon size={11} style={{ color: active ? "#C4B5FD" : "#4B5563" }} />
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.68rem",
                  color: active ? "#fff" : "#6B7280", letterSpacing:"0.03em" }}>
                  {t.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Podium */}
        {top3.length >= 3 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity:0, scale:0.95 }}
              animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0, scale:0.95 }}
              transition={{ duration:0.28 }}
              className="relative rounded-2xl overflow-hidden pt-3 px-2"
              style={{
                background:"linear-gradient(145deg, rgba(26,16,64,0.9) 0%, rgba(10,15,30,0.9) 100%)",
                border:"1px solid rgba(251,191,36,0.2)",
                boxShadow:"0 0 40px rgba(251,191,36,0.08), 0 0 60px rgba(109,40,217,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
                backdropFilter:"blur(16px)",
              }}
            >
              {/* Ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 blur-3xl opacity-20 rounded-full" style={{ background:"#FBBF24" }} />

              <div className="flex items-end gap-2 relative">
                <PodiumCard player={top3[1]} height={64} />
                <PodiumCard player={top3[0]} height={96} isTop />
                <PodiumCard player={top3[2]} height={48} />
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:"Players",    value:"2.4M", icon:"🌍", color:"#22D3EE" },
            { label:"This Week",  value:"+12K", icon:"📈", color:"#34D399" },
            { label:"Top Country",value:"🇺🇸 USA", icon:"🏆", color:"#FBBF24" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-2.5 rounded-xl"
              style={{ background:"rgba(10,15,30,0.75)", border:`1px solid ${s.color}22`, backdropFilter:"blur(6px)" }}>
              <span style={{ fontSize:"0.9rem" }}>{s.icon}</span>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.85rem", color:s.color }}>
                {s.value}
              </span>
              <span style={{ color:"#6B7280", fontSize:"0.58rem" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Rank list — top 3 + rest */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab+"-list"}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.22 }}
            className="flex flex-col gap-2"
          >
            {/* Top 3 in list view */}
            {top3.map((p, i) => <RankRow key={p.name} player={p} index={i} />)}

            {/* Separator */}
            {rest.length > 0 && (
              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 h-px" style={{ background:"rgba(255,255,255,0.05)" }} />
                <Star size={10} style={{ color:"#4B5563" }} />
                <div className="flex-1 h-px" style={{ background:"rgba(255,255,255,0.05)" }} />
              </div>
            )}

            {/* Rest */}
            {rest.map((p, i) => <RankRow key={p.name} player={p} index={i+3} />)}

            {/* Gap indicator before me if not in top 10 */}
            {me && me.rank > 10 && (
              <>
                <div className="flex items-center justify-center gap-1 py-1">
                  {[0,1,2].map((d) => (
                    <motion.div key={d} animate={{ opacity:[0.2,0.6,0.2] }} transition={{ duration:1.2, delay:d*0.2, repeat:Infinity }}
                      className="w-1.5 h-1.5 rounded-full" style={{ background:"#4B5563" }} />
                  ))}
                </div>
                <RankRow player={me} index={0} />
              </>
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* Sticky current user card */}
      <StickyUserCard player={me} tab={activeTab} />
    </div>
  );
}
