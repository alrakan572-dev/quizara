import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Crown, Trophy } from "lucide-react";
import { GameAPI, GameAPIError, type LeaderboardEntry } from "../../api";

export function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<GameAPIError | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    GameAPI.getLeaderboard({ limit: 50 })
      .then((data) => { if (active) { setLeaders(data.leaders); setCurrentUser(data.current_user); } })
      .catch((value) => { if (active) setError(value instanceof GameAPIError ? value : new GameAPIError({ message: value instanceof Error ? value.message : "Unable to load leaderboard" })); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <StateCard emoji="🏆" title="Loading leaderboard..." />;
  if (error) return <StateCard emoji="⚠️" title={error.message} />;

  const top = leaders.slice(0, 3);
  return (
    <div className="relative flex flex-col gap-4 pb-4">
      <div className="rounded-3xl px-5 py-5 text-center" style={{ background: "linear-gradient(145deg,#1A1040,#0F1C3A)", border: "1px solid rgba(251,191,36,.3)", boxShadow: "0 0 34px rgba(109,40,217,.18)" }}>
        <Trophy size={34} style={{ color: "#FBBF24", margin: "0 auto 8px" }} />
        <h2 style={{ color: "#F9FAFB", fontFamily: "'Rajdhani',sans-serif", fontSize: "1.5rem", fontWeight: 800 }}>GLOBAL LEADERBOARD</h2>
        <p style={{ color: "#9CA3AF", fontSize: ".8rem" }}>Top Quizora players</p>
      </div>

      {top.length > 0 && (
        <div className="grid grid-cols-3 items-end gap-2">
          {top.map((player, index) => (
            <motion.div key={player.telegram_id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center rounded-2xl px-2 py-4" style={{ background: index === 0 ? "rgba(251,191,36,.13)" : "#1F2937", border: `1px solid ${index === 0 ? "rgba(251,191,36,.45)" : "rgba(109,40,217,.2)"}`, order: index === 0 ? 2 : index === 1 ? 1 : 3 }}>
              {index === 0 && <Crown size={18} style={{ color: "#FBBF24" }} />}
              <div className="my-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl text-2xl" style={{ background: "#111827" }}>
                {player.photo_url ? <img src={player.photo_url} alt="" className="h-full w-full object-cover" /> : "🦊"}
              </div>
              <strong style={{ color: "#F9FAFB", fontSize: ".72rem", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis" }}>{player.username ?? "Player"}</strong>
              <span style={{ color: "#FBBF24", fontSize: ".75rem" }}>{player.total_points.toLocaleString()}</span>
              <span style={{ color: "#9CA3AF", fontSize: ".65rem" }}>#{player.rank}</span>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {leaders.map((player, index) => {
          const isMe = currentUser?.telegram_id === player.telegram_id;
          return (
            <motion.div key={player.telegram_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .025 }} className="flex items-center gap-3 rounded-xl px-3 py-3" style={{ background: isMe ? "rgba(109,40,217,.22)" : "#1F2937", border: isMe ? "1px solid rgba(167,139,250,.55)" : "1px solid rgba(255,255,255,.05)" }}>
              <span style={{ width: 28, color: player.rank <= 3 ? "#FBBF24" : "#9CA3AF", fontWeight: 800 }}>#{player.rank}</span>
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl" style={{ background: "#111827" }}>{player.photo_url ? <img src={player.photo_url} alt="" className="h-full w-full object-cover" /> : "🦊"}</div>
              <div className="min-w-0 flex-1"><div className="truncate" style={{ color: "#F9FAFB", fontWeight: 700 }}>{player.username ?? "Player"}{player.vip ? " ⭐" : ""}</div><div style={{ color: "#6B7280", fontSize: ".7rem" }}>Level {player.level}</div></div>
              <strong style={{ color: "#FBBF24" }}>{player.total_points.toLocaleString()}</strong>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StateCard({ emoji, title }: { emoji: string; title: string }) { return <div className="flex min-h-[440px] items-center justify-center"><div className="rounded-2xl px-6 py-6 text-center" style={{ background: "#1F2937", color: "white" }}><div className="text-4xl">{emoji}</div><p>{title}</p></div></div>; }
