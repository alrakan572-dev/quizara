import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Crown, CheckCircle2 } from "lucide-react";
import { GameAPI, GameAPIError, type VipStatus } from "../../api";

interface Props { onBack: () => void; userPoints: number; }
export function VIPPage({ onBack, userPoints }: Props) {
  const [data, setData] = useState<VipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<GameAPIError | null>(null);
  useEffect(() => { let active = true; GameAPI.getVipStatus().then((value) => { if (active) setData(value); }).catch((value) => { if (active) setError(value instanceof GameAPIError ? value : new GameAPIError({ message: value instanceof Error ? value.message : "Unable to load VIP status" })); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  return <div className="flex flex-col gap-5 pb-4">
    <div className="flex items-center justify-between"><button type="button" onClick={onBack} className="rounded-xl p-2" style={{ background: "rgba(251,191,36,.12)", color: "#FBBF24" }}><ArrowLeft size={17} /></button><div style={{ color: "#FBBF24", fontWeight: 800 }}>{userPoints.toLocaleString()} PTS</div></div>
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl px-6 py-7 text-center" style={{ background: "linear-gradient(145deg,#3B2505,#1A1040)", border: "1.5px solid rgba(251,191,36,.5)", boxShadow: "0 0 54px rgba(251,191,36,.18)" }}>
      <Crown size={58} style={{ color: "#FBBF24", margin: "0 auto", filter: "drop-shadow(0 0 15px rgba(251,191,36,.55))" }} />
      <h2 style={{ color: "#F9FAFB", fontFamily: "'Rajdhani',sans-serif", fontSize: "1.8rem", fontWeight: 900 }}>QUIZORA VIP</h2>
      {loading ? <p style={{ color: "#9CA3AF" }}>Checking status...</p> : error ? <p style={{ color: "#FCA5A5" }}>{error.message}</p> : data?.vip ? <><div className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2" style={{ background: "rgba(16,185,129,.16)", color: "#6EE7B7" }}><CheckCircle2 size={16} /> ACTIVE</div><p style={{ color: "#D1D5DB", marginTop: 12 }}>Your VIP membership is active{data.subscription?.expire_date ? ` until ${new Date(data.subscription.expire_date).toLocaleDateString()}` : ""}.</p></> : <><p style={{ color: "#D1D5DB" }}>Unlock premium benefits, bonus points and an ad-free experience.</p><div className="mt-4 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,.06)", color: "#9CA3AF" }}>Purchases will be connected to Telegram Stars in the payment integration stage.</div></>}
    </motion.div>
    <div className="grid grid-cols-2 gap-3">{["No ads","VIP badge","Bonus points","Extra Lucky Boxes","Unlimited games","Priority rewards"].map((text) => <div key={text} className="flex items-center gap-2 rounded-xl px-3 py-3" style={{ background: "#1F2937", color: "#D1D5DB" }}><CheckCircle2 size={14} style={{ color: "#FBBF24" }} />{text}</div>)}</div>
  </div>;
}
