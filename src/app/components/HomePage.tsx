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

import { useHomeData } from "../../hooks/useHomeData";
import type { AppLanguage } from "../../api";

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
] as const;

interface HomePageProps {
  onNavigate: (page: string) => void;
  language?: AppLanguage;
}

export function HomePage({
  onNavigate,
  language = "en",
}: HomePageProps) {
  const { data, loading, error, refresh } = useHomeData({
    language,
  });

  const user = data?.user;
  const points = user?.points ?? 0;
  const level = user?.level ?? 1;
  const gamesPlayed = user?.games_played ?? 0;
  const totalCorrect = user?.total_correct ?? 0;
  const totalWrong = user?.total_wrong ?? 0;
  const answered = totalCorrect + totalWrong;

  const winRate =
    answered > 0 ? Math.round((totalCorrect / answered) * 100) : 0;

  const displayName =
    user?.username || user?.first_name || "Quizora Player";

  const currentRank = data?.leaderboard.current_user?.rank ?? 0;

  const xpProgress = Math.min(
    Math.max(((points % 1000) / 1000) * 100, 0),
    100,
  );

  if (loading && !data) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div
          className="rounded-2xl px-6 py-5 text-center"
          style={{
            background: "#1F2937",
            border: "1px solid rgba(109,40,217,0.3)",
            color: "#F9FAFB",
            boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
          }}
        >
          <div className="mb-2 text-2xl">🎮</div>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
            }}
          >
            Loading Quizora...
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div
          className="max-w-sm rounded-2xl px-6 py-5 text-center"
          style={{
            background: "#1F2937",
            border: "1px solid rgba(239,68,68,0.35)",
            color: "#F9FAFB",
            boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
          }}
        >
          <div className="mb-2 text-2xl">⚠️</div>
          <div className="mb-3">{error.message}</div>
          <button
            type="button"
            onClick={() => {
              void refresh();
            }}
            className="rounded-xl px-4 py-2"
            style={{
              background: "#6D28D9",
              color: "#FFFFFF",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-2">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, #2D1B69 0%, #1F2937 60%, #111827 100%)",
          border: "1px solid rgba(109,40,217,0.35)",
          boxShadow:
            "0 0 32px rgba(109,40,217,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30 blur-2xl"
          style={{ background: "#6D28D9" }}
        />
        <div
          className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-20 blur-2xl"
          style={{ background: "#FBBF24" }}
        />

        <div className="relative flex items-center gap-3 p-4">
          <div className="relative flex-shrink-0">
            <div
              className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl text-2xl"
              style={{
                background: "linear-gradient(135deg, #6D28D9, #4C1D95)",
                boxShadow: "0 0 16px rgba(109,40,217,0.5)",
              }}
            >
              {user?.photo_url ? (
                <img
                  src={user.photo_url}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                "🦊"
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#111827] bg-green-400" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2">
              <span
                className="truncate"
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: "#F9FAFB",
                }}
              >
                {displayName}
              </span>

              {user?.vip && (
                <span
                  className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs"
                  style={{
                    background:
                      "linear-gradient(90deg, #D97706, #FBBF24)",
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
              )}
            </div>

            <div className="mb-1 flex items-center gap-1">
              <Flame size={13} style={{ color: "#FBBF24" }} />
              <span
                style={{
                  color: "#FBBF24",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                }}
              >
                {points.toLocaleString()}
              </span>
              <span
                style={{
                  color: "#9CA3AF",
                  fontSize: "0.72rem",
                  marginLeft: 2,
                }}
              >
                pts
              </span>
            </div>
          </div>

          <div
            className="flex flex-shrink-0 flex-col items-center justify-center rounded-xl px-3 py-2"
            style={{
              background: "rgba(109,40,217,0.25)",
              border: "1px solid rgba(109,40,217,0.4)",
            }}
          >
            <ChevronUp size={12} style={{ color: "#10B981" }} />
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "#F9FAFB",
              }}
            >
              #{currentRank || "—"}
            </span>
            <span style={{ color: "#9CA3AF", fontSize: "0.6rem" }}>
              RANK
            </span>
          </div>
        </div>

        <div className="relative px-4 pb-4">
          <div className="mb-1 flex justify-between">
            <span style={{ color: "#9CA3AF", fontSize: "0.68rem" }}>
              Level {level}
            </span>
            <span style={{ color: "#9CA3AF", fontSize: "0.68rem" }}>
              {points.toLocaleString()} XP
            </span>
          </div>

          <div
            className="h-1.5 w-full rounded-full"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${xpProgress}%`,
                background: "linear-gradient(90deg, #6D28D9, #FBBF24)",
                boxShadow: "0 0 8px rgba(109,40,217,0.6)",
              }}
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Games",
            value: gamesPlayed.toLocaleString(),
            icon: "🎮",
          },
          {
            label: "Win Rate",
            value: `${winRate}%`,
            icon: "🏆",
          },
          {
            label: "Coins",
            value: (user?.coins ?? 0).toLocaleString(),
            icon: "🪙",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05, duration: 0.35 }}
            className="flex flex-col items-center rounded-xl py-3"
            style={{
              background: "#1F2937",
              border: "1px solid rgba(109,40,217,0.18)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            }}
          >
            <span className="mb-0.5 text-lg">{stat.icon}</span>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "#F9FAFB",
              }}
            >
              {stat.value}
            </span>
            <span style={{ color: "#9CA3AF", fontSize: "0.65rem" }}>
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>

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

      <div className="grid grid-cols-3 gap-3">
        {MENU_CARDS.map((card, index) => (
          <GameCard
            key={card.id}
            card={card}
            index={index}
            onNavigate={onNavigate}
          />
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
  card: (typeof MENU_CARDS)[number];
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
      type="button"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: 0.15 + index * 0.04,
        duration: 0.3,
        type: "spring",
        stiffness: 200,
      }}
      whileTap={{ scale: 0.93 }}
      onClick={handleClick}
      className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl px-2 py-4"
      style={{
        background: "linear-gradient(145deg, #1F2937, #263248)",
        border: `1px solid rgba(${hexToRgb(card.color)}, 0.22)`,
        boxShadow:
          "0 4px 16px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.03) inset",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${card.color}22, ${card.color}44)`,
          border: `1px solid ${card.color}55`,
          boxShadow: `0 0 12px ${card.color}33`,
        }}
      >
        <Icon size={20} style={{ color: card.color }} strokeWidth={2} />
      </div>

      <span style={{ fontSize: "1.15rem", lineHeight: 1 }}>
        {card.emoji}
      </span>

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
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
        result[3],
        16,
      )}`
    : "109, 40, 217";
}