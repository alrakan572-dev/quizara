import { motion } from "motion/react";
import {
  Puzzle,
  Brain,
  Zap,
  CalendarDays,
  Search,
  Gift,
  Medal,
  Trophy,
  User,
  Star,
  Flame,
  ChevronUp,
} from "lucide-react";

const MENU_CARDS = [
  { id: 1, label: "Riddles", emoji: "🧩", icon: Puzzle, color: "#7C3AED", glow: "#6D28D9" },
  { id: 2, label: "General Knowledge", emoji: "🧠", icon: Brain, color: "#0EA5E9", glow: "#0284C7" },
  { id: 3, label: "Fastest", emoji: "⚡", icon: Zap, color: "#F59E0B", glow: "#D97706" },
  { id: 4, label: "Daily Challenges", emoji: "📅", icon: CalendarDays, color: "#10B981", glow: "#059669" },
  { id: 5, label: "Find the Difference", emoji: "🔎", icon: Search, color: "#EC4899", glow: "#DB2777" },
  { id: 6, label: "Lucky Box", emoji: "🎁", icon: Gift, color: "#FBBF24", glow: "#D97706" },
  { id: 7, label: "Weekly Challenge", emoji: "🏅", icon: Medal, color: "#8B5CF6", glow: "#7C3AED" },
  { id: 8, label: "Leaderboard", emoji: "🏆", icon: Trophy, color: "#F97316", glow: "#EA580C" },
  { id: 9, label: "Profile", emoji: "👤", icon: User, color: "#6366F1", glow: "#4F46E5" },
];

interface HomePageProps {
  onNavigate: (page: string) => void;
  userPoints?: number;
}

export function HomePage({ onNavigate, userPoints = 48250 }: HomePageProps) {
  return (
    <div className="flex flex-col gap-5 pb-2">
      {/* User Stats Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #2D1B69 0%, #1F2937 60%, #111827 100%)",
          border: "1px solid rgba(109,40,217,0.35)",
          boxShadow: "0 0 32px rgba(109,40,217,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Decorative orb */}
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-30 blur-2xl"
          style={{ background: "#6D28D9" }}
        />
        <div
          className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-20 blur-2xl"
          style={{ background: "#FBBF24" }}
        />

        <div className="relative p-4 flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{
                background: "linear-gradient(135deg, #6D28D9, #4C1D95)",
                boxShadow: "0 0 16px rgba(109,40,217,0.5)",
              }}
            >
              🦊
            </div>
            {/* Online dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-[#111827]" />
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="truncate"
                style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#F9FAFB" }}
              >
                Alex_Quizmaster
              </span>
              {/* VIP Badge */}
              <span
                className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs"
                style={{
                  background: "linear-gradient(90deg, #D97706, #FBBF24)",
                  color: "#111827",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  letterSpacing: "0.08em",
                  boxShadow: "0 0 8px rgba(251,191,36,0.4)",
                }}
              >
                ⭐ VIP
              </span>
            </div>

            {/* Points row */}
            <div className="flex items-center gap-1 mb-1">
              <Flame size={13} style={{ color: "#FBBF24" }} />
              <span style={{ color: "#FBBF24", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
                {userPoints.toLocaleString()}
              </span>
              <span style={{ color: "#9CA3AF", fontSize: "0.72rem", marginLeft: 2 }}>pts</span>
            </div>
          </div>

          {/* Ranking badge */}
          <div
            className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-2"
            style={{
              background: "rgba(109,40,217,0.25)",
              border: "1px solid rgba(109,40,217,0.4)",
            }}
          >
            <ChevronUp size={12} style={{ color: "#10B981" }} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#F9FAFB" }}>
              #12
            </span>
            <span style={{ color: "#9CA3AF", fontSize: "0.6rem" }}>RANK</span>
          </div>
        </div>

        {/* XP progress bar */}
        <div className="relative px-4 pb-4">
          <div className="flex justify-between mb-1">
            <span style={{ color: "#9CA3AF", fontSize: "0.68rem" }}>Level 23</span>
            <span style={{ color: "#9CA3AF", fontSize: "0.68rem" }}>{userPoints.toLocaleString()} / 55,000 XP</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: "87%",
                background: "linear-gradient(90deg, #6D28D9, #FBBF24)",
                boxShadow: "0 0 8px rgba(109,40,217,0.6)",
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Games", value: "342", icon: "🎮" },
          { label: "Win Rate", value: "74%", icon: "🏆" },
          { label: "Streak", value: "12d", icon: "🔥" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.35 }}
            className="rounded-xl flex flex-col items-center py-3"
            style={{
              background: "#1F2937",
              border: "1px solid rgba(109,40,217,0.18)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            }}
          >
            <span className="text-lg mb-0.5">{stat.icon}</span>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "#F9FAFB" }}>
              {stat.value}
            </span>
            <span style={{ color: "#9CA3AF", fontSize: "0.65rem" }}>{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Section title */}
      <div className="flex items-center justify-between">
        <h2
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: "1.1rem",
            color: "#F9FAFB",
            letterSpacing: "0.04em",
            margin: 0,
          }}
        >
          GAME MODES
        </h2>
        <Star size={14} style={{ color: "#FBBF24" }} />
      </div>

      {/* 9-card grid */}
      <div className="grid grid-cols-3 gap-3">
        {MENU_CARDS.map((card, i) => (
          <GameCard key={card.id} card={card} index={i} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

function GameCard({
  card,
  index,
  onNavigate,
}: {
  card: (typeof MENU_CARDS)[0];
  index: number;
  onNavigate: (page: string) => void;
}) {
  const Icon = card.icon;

  const handleClick = () => {
    if (card.label === "Leaderboard") onNavigate("leaderboard");
    else if (card.label === "Profile") onNavigate("profile");
    else if (card.label === "Riddles") onNavigate("riddles");
    else if (card.label === "General Knowledge") onNavigate("general-knowledge");
    else if (card.label === "Daily Challenges") onNavigate("daily-challenge");
    else if (card.label === "Fastest") onNavigate("fastest");
    else if (card.label === "Lucky Box") onNavigate("lucky-box");
    else if (card.label === "Find the Difference") onNavigate("find-difference");
    else if (card.label === "Weekly Challenge") onNavigate("weekly-challenge");
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15 + index * 0.04, duration: 0.3, type: "spring", stiffness: 200 }}
      whileTap={{ scale: 0.93 }}
      onClick={handleClick}
      className="flex flex-col items-center justify-center rounded-2xl py-4 px-2 gap-2 cursor-pointer w-full"
      style={{
        background: `linear-gradient(145deg, #1F2937, #263248)`,
        border: `1px solid rgba(${hexToRgb(card.color)}, 0.22)`,
        boxShadow: `0 4px 16px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.03) inset`,
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
    >
      {/* Icon circle */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${card.color}22, ${card.color}44)`,
          border: `1px solid ${card.color}55`,
          boxShadow: `0 0 12px ${card.color}33`,
        }}
      >
        <Icon size={20} style={{ color: card.color }} strokeWidth={2} />
      </div>

      {/* Emoji */}
      <span style={{ fontSize: "1.15rem", lineHeight: 1 }}>{card.emoji}</span>

      {/* Label */}
      <span
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 600,
          fontSize: "0.7rem",
          color: "#D1D5DB",
          textAlign: "center",
          lineHeight: 1.2,
          letterSpacing: "0.02em",
        }}
      >
        {card.label}
      </span>
    </motion.button>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "109, 40, 217";
}
