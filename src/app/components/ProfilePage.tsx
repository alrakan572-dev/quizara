import { motion } from "motion/react";
import { Brain, CheckCircle2, Edit3, Gift, Settings, Target, Trophy, Users } from "lucide-react";
import { useProfile } from "../../hooks/useProfile";

interface Props { onNavigate: (page: string) => void; }

export function ProfilePage({ onNavigate }: Props) {
  const { profile, loading, error, refresh } = useProfile();

  if (loading && !profile) return <StateCard emoji="👤" message="Loading your profile..." />;
  if (error && !profile) return <StateCard emoji="⚠️" message={error.message} action="TRY AGAIN" onAction={() => void refresh()} />;
  if (!profile) return <StateCard emoji="⚠️" message="Profile is unavailable" />;

  const answered = profile.total_correct + profile.total_wrong;
  const accuracy = answered > 0 ? Math.round((profile.total_correct / answered) * 100) : 0;
  const name = profile.username?.trim() || profile.first_name?.trim() || "Quizora Player";

  return (
    <div className="flex flex-col gap-4 pb-4">
      <motion.section initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl px-5 py-5"
        style={{ background: "linear-gradient(145deg,#2D1B69,#111827)", border: "1px solid rgba(167,139,250,.35)", boxShadow: "0 0 36px rgba(109,40,217,.2)" }}>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl text-4xl"
            style={{ background: "#111827", border: "1px solid rgba(251,191,36,.35)" }}>
            {profile.photo_url ? <img src={profile.photo_url} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : "🦊"}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate" style={{ color: "#F9FAFB", fontWeight: 800, fontSize: "1.25rem", margin: 0 }}>{name}{profile.vip ? " ⭐" : ""}</h2>
            <p style={{ color: "#9CA3AF", fontSize: ".75rem", margin: "3px 0" }}>Level {profile.level}{profile.country ? ` · ${profile.country}` : ""}</p>
            <p style={{ color: "#A78BFA", fontSize: ".72rem", margin: 0 }}>{profile.points.toLocaleString()} points</p>
          </div>
        </div>
        {profile.bio && <p className="mt-4 rounded-2xl px-3 py-3" style={{ background: "rgba(17,24,39,.55)", color: "#D1D5DB", fontSize: ".78rem", marginBottom: 0 }}>{profile.bio}</p>}
      </motion.section>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Brain size={17} />} label="Games Played" value={profile.games_played} color="#22D3EE" />
        <Stat icon={<Target size={17} />} label="Accuracy" value={`${accuracy}%`} color="#34D399" />
        <Stat icon={<CheckCircle2 size={17} />} label="Correct" value={profile.total_correct} color="#A78BFA" />
        <Stat icon={<Trophy size={17} />} label="Level" value={profile.level} color="#FBBF24" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Action icon={<Edit3 size={18} />} label="Edit Profile" onClick={() => onNavigate("edit-profile")} />
        <Action icon={<Settings size={18} />} label="Settings" onClick={() => onNavigate("settings")} />
        <Action icon={<Users size={18} />} label="Invite Friends" onClick={() => onNavigate("invite")} />
        <Action icon={<Gift size={18} />} label="Rewards" onClick={() => onNavigate("rewards")} />
      </div>

      <div className="rounded-2xl px-4 py-4" style={{ background: "#1F2937", border: "1px solid rgba(109,40,217,.18)" }}>
        <div style={{ color: "#9CA3AF", fontSize: ".7rem" }}>Telegram ID</div>
        <div style={{ color: "#F9FAFB", fontWeight: 700 }}>{profile.telegram_id}</div>
        <div className="mt-3" style={{ color: "#9CA3AF", fontSize: ".7rem" }}>Member since</div>
        <div style={{ color: "#F9FAFB", fontWeight: 700 }}>{formatDate(profile.created_at)}</div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return <div className="rounded-2xl px-4 py-4" style={{ background: "#1F2937", border: `1px solid ${color}33` }}>
    <div className="mb-2" style={{ color }}>{icon}</div><strong style={{ color: "#F9FAFB", fontSize: "1.1rem" }}>{value}</strong>
    <div style={{ color: "#9CA3AF", fontSize: ".68rem" }}>{label}</div>
  </div>;
}

function Action({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <motion.button type="button" whileTap={{ scale: .96 }} onClick={onClick} className="flex items-center gap-2 rounded-2xl px-4 py-4 text-left"
    style={{ background: "linear-gradient(145deg,#1F2937,#111827)", border: "1px solid rgba(167,139,250,.22)", color: "#EDE9FE" }}>
    {icon}<span style={{ fontWeight: 700, fontSize: ".8rem" }}>{label}</span>
  </motion.button>;
}

function StateCard({ emoji, message, action, onAction }: { emoji: string; message: string; action?: string; onAction?: () => void }) {
  return <div className="flex min-h-[440px] items-center justify-center"><div className="w-full rounded-2xl px-6 py-6 text-center" style={{ background: "#1F2937", color: "#F9FAFB" }}>
    <div className="text-4xl">{emoji}</div><p>{message}</p>{action && onAction && <button type="button" onClick={onAction} className="rounded-xl px-4 py-2" style={{ background: "#6D28D9", color: "white" }}>{action}</button>}
  </div></div>;
}

function formatDate(value: string | null): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString();
}
