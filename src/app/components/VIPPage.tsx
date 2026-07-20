import { motion } from "motion/react";
import { ArrowLeft, Crown, CheckCircle2, RefreshCw } from "lucide-react";
import { useVip } from "../../hooks/useVip";

interface Props { onBack: () => void; userPoints: number; }

function formatPlanPrice(price: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(price);
}

export function VIPPage({ onBack, userPoints }: Props) {
  const { status, plans, loading, error, reload } = useVip();

  return <div className="flex flex-col gap-5 pb-4">
    <div className="flex items-center justify-between">
      <button type="button" onClick={onBack} className="rounded-xl p-2" style={{ background: "rgba(251,191,36,.12)", color: "#FBBF24" }}><ArrowLeft size={17} /></button>
      <div style={{ color: "#FBBF24", fontWeight: 800 }}>{userPoints.toLocaleString()} PTS</div>
    </div>

    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl px-6 py-7 text-center" style={{ background: "linear-gradient(145deg,#3B2505,#1A1040)", border: "1.5px solid rgba(251,191,36,.5)", boxShadow: "0 0 54px rgba(251,191,36,.18)" }}>
      <Crown size={58} style={{ color: "#FBBF24", margin: "0 auto", filter: "drop-shadow(0 0 15px rgba(251,191,36,.55))" }} />
      <h2 style={{ color: "#F9FAFB", fontFamily: "'Rajdhani',sans-serif", fontSize: "1.8rem", fontWeight: 900 }}>QUIZORA VIP</h2>
      {loading ? <p style={{ color: "#9CA3AF" }}>Checking VIP membership…</p> : error ? <div className="mt-3"><p style={{ color: "#FCA5A5" }}>{error.message}</p><button type="button" onClick={reload} className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2" style={{ background: "rgba(255,255,255,.08)", color: "#F9FAFB" }}><RefreshCw size={15} /> Retry</button></div> : status?.vip ? <><div className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2" style={{ background: "rgba(16,185,129,.16)", color: "#6EE7B7" }}><CheckCircle2 size={16} /> ACTIVE</div><p style={{ color: "#D1D5DB", marginTop: 12 }}>Your {status.plan?.name ?? "VIP"} membership is active{status.subscription?.expire_date ? ` until ${new Date(status.subscription.expire_date).toLocaleDateString()}` : ""}.</p></> : <p style={{ color: "#D1D5DB" }}>Choose from the active VIP plans configured in Quizora.</p>}
    </motion.div>

    {!loading && !error && !status?.vip && (plans.length === 0 ? <div className="rounded-2xl px-5 py-6 text-center" style={{ background: "#1F2937", color: "#9CA3AF" }}>No VIP plans are currently available.</div> : <div className="flex flex-col gap-3">{plans.map((plan) => <div key={plan.id} className="rounded-2xl p-5" style={{ background: "#1F2937", border: "1px solid rgba(251,191,36,.25)" }}>
      <div className="flex items-start justify-between gap-3"><div><h3 style={{ color: "#F9FAFB", fontWeight: 800, fontSize: "1.1rem" }}>{plan.name}</h3><p style={{ color: "#9CA3AF", fontSize: ".9rem" }}>{plan.duration_days} days · {formatPlanPrice(plan.price)}</p></div><Crown size={24} style={{ color: "#FBBF24" }} /></div>
      {plan.description ? <p className="mt-3" style={{ color: "#D1D5DB" }}>{plan.description}</p> : null}
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {plan.unlimited_games ? <span style={{ color: "#D1D5DB" }}>✓ Unlimited games</span> : null}
        {!plan.ads_enabled ? <span style={{ color: "#D1D5DB" }}>✓ No ads</span> : null}
        {plan.vip_badge ? <span style={{ color: "#D1D5DB" }}>✓ VIP badge</span> : null}
        {plan.bonus_points_percent > 0 ? <span style={{ color: "#D1D5DB" }}>✓ {plan.bonus_points_percent}% bonus points</span> : null}
        {plan.lucky_boxes_per_day > 0 ? <span style={{ color: "#D1D5DB" }}>✓ {plan.lucky_boxes_per_day} Lucky Boxes/day</span> : null}
      </div>
      <div className="mt-4 rounded-xl px-4 py-3 text-center text-sm" style={{ background: "rgba(255,255,255,.06)", color: "#9CA3AF" }}>Purchase is disabled until the verified Telegram Stars payment webhook is connected.</div>
    </div>)}</div>)}

    {status?.vip && status.benefits ? <div className="grid grid-cols-2 gap-3">
      {status.benefits.unlimited_games ? <Benefit text="Unlimited games" /> : null}
      {!status.benefits.ads_enabled ? <Benefit text="No ads" /> : null}
      {status.benefits.vip_badge ? <Benefit text="VIP badge" /> : null}
      {status.benefits.bonus_points_percent > 0 ? <Benefit text={`${status.benefits.bonus_points_percent}% bonus points`} /> : null}
      {status.benefits.lucky_boxes_per_day > 0 ? <Benefit text={`${status.benefits.lucky_boxes_per_day} Lucky Boxes/day`} /> : null}
    </div> : null}
  </div>;
}

function Benefit({ text }: { text: string }) {
  return <div className="flex items-center gap-2 rounded-xl px-3 py-3" style={{ background: "#1F2937", color: "#D1D5DB" }}><CheckCircle2 size={14} style={{ color: "#FBBF24" }} />{text}</div>;
}
