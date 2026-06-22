import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Crown, Check, X, Zap, Star, Shield,
  Sparkles, Gift, Palette, Lock, ChevronRight,
  RefreshCw, Info,
} from "lucide-react";

/* ─── Plans ──────────────────────────────────────────────────────────────── */
interface Plan {
  id: string; label: string; price: string; per: string;
  original?: string; save?: string; popular?: boolean;
  color: string; glow: string; badge?: string;
}
const PLANS: Plan[] = [
  {
    id:"weekly",  label:"Weekly",  price:"$1.99",  per:"/ week",
    color:"#22D3EE", glow:"rgba(34,211,238,0.35)",
  },
  {
    id:"monthly", label:"Monthly", price:"$5.99",  per:"/ month",
    original:"$7.99", save:"25% OFF", popular:true,
    color:"#FBBF24", glow:"rgba(251,191,36,0.45)", badge:"MOST POPULAR",
  },
  {
    id:"yearly",  label:"Yearly",  price:"$39.99", per:"/ year",
    original:"$71.88", save:"44% OFF",
    color:"#A78BFA", glow:"rgba(167,139,250,0.4)", badge:"BEST VALUE",
  },
];

/* ─── Benefits ───────────────────────────────────────────────────────────── */
const BENEFITS = [
  { icon:Zap,      label:"Double Reward Points",         desc:"Earn 2× points on every game",         color:"#FBBF24" },
  { icon:Shield,   label:"Ad-Free Experience",            desc:"Zero interruptions, pure gameplay",     color:"#22D3EE" },
  { icon:Crown,    label:"Exclusive VIP Badge",           desc:"Stand out on the leaderboard",          color:"#F97316" },
  { icon:Star,     label:"Exclusive Quizzes",             desc:"VIP-only question packs & categories",  color:"#A78BFA" },
  { icon:Sparkles, label:"Early Access",                  desc:"New game modes before anyone else",      color:"#34D399" },
  { icon:Palette,  label:"Themes & Profile Frames",       desc:"Unlock premium visual customisation",   color:"#F87171" },
  { icon:Gift,     label:"Monthly Lucky Box Bonus",       desc:"+3 free Lucky Box opens per month",     color:"#FBBF24" },
  { icon:Star,     label:"Priority Support",              desc:"VIP-only customer support channel",     color:"#22D3EE" },
];

/* ─── Comparison rows ────────────────────────────────────────────────────── */
const COMPARISON = [
  { feature:"Daily Lucky Box Opens",  free:"3 / day",  vip:"6 / day"    },
  { feature:"Points per Game",        free:"Standard", vip:"2× Boosted" },
  { feature:"Ads",                    free:true,       vip:false        },   // true = has ads
  { feature:"VIP Badge",              free:false,      vip:true         },
  { feature:"Exclusive Quizzes",      free:false,      vip:true         },
  { feature:"Custom Themes",          free:false,      vip:true         },
  { feature:"Early Access",           free:false,      vip:true         },
  { feature:"Priority Support",       free:false,      vip:true         },
];

/* ─── Gold particles ─────────────────────────────────────────────────────── */
function GoldParticles() {
  const pts = Array.from({ length:28 }, (_, i) => ({
    id:i, x:Math.random()*100, y:Math.random()*100,
    size:1.5+Math.random()*3,
    color:i%4===0?"#FBBF24":i%4===1?"#F59E0B":i%4===2?"#A78BFA":"#22D3EE",
    dur:3+Math.random()*5, delay:Math.random()*4,
  }));
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex:0 }}>
      {pts.map((p) => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size, background:p.color, filter:"blur(0.8px)" }}
          animate={{ opacity:[0.05,0.55,0.05], y:[-10,10,-10], scale:[1,1.6,1] }}
          transition={{ duration:p.dur, delay:p.delay, repeat:Infinity, ease:"easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Crown hero ─────────────────────────────────────────────────────────── */
function CrownHero() {
  return (
    <div className="relative flex items-center justify-center" style={{ height:160 }}>
      {/* Outer pulsing rings */}
      {[80,100,120].map((size, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width:size, height:size, border:"1px solid rgba(251,191,36,0.25)" }}
          animate={{ scale:[1,1.12,1], opacity:[0.3,0.6,0.3] }}
          transition={{ duration:2.5+i*0.4, repeat:Infinity, ease:"easeInOut", delay:i*0.3 }}
        />
      ))}

      {/* Glow blob */}
      <motion.div
        animate={{ opacity:[0.3,0.65,0.3], scale:[1,1.15,1] }}
        transition={{ duration:2.2, repeat:Infinity, ease:"easeInOut" }}
        className="absolute w-32 h-32 rounded-full blur-3xl"
        style={{ background:"radial-gradient(circle, #FBBF2488 0%, #6D28D944 60%, transparent 100%)" }}
      />

      {/* Crown container */}
      <motion.div
        animate={{
          y:[0,-8,0],
          filter:["drop-shadow(0 0 16px #FBBF2466)","drop-shadow(0 0 40px #FBBF24cc)","drop-shadow(0 0 16px #FBBF2466)"],
        }}
        transition={{ duration:2.4, repeat:Infinity, ease:"easeInOut" }}
        className="relative z-10 w-24 h-24 rounded-3xl flex items-center justify-center"
        style={{
          background:"linear-gradient(145deg, rgba(217,119,6,0.5) 0%, rgba(251,191,36,0.35) 50%, rgba(109,40,217,0.4) 100%)",
          border:"2px solid rgba(251,191,36,0.6)",
          boxShadow:"0 0 40px rgba(251,191,36,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        <Crown size={44} style={{ color:"#FBBF24" }} strokeWidth={1.5} />
      </motion.div>

      {/* Orbiting gold dots */}
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const r = 66;
        return (
          <motion.div key={i} className="absolute w-2.5 h-2.5 rounded-full"
            style={{
              left:"50%", top:"50%",
              x: Math.cos(rad)*r - 5,
              y: Math.sin(rad)*r - 5,
              background:`radial-gradient(circle, #FBBF24, #F59E0B)`,
              boxShadow:"0 0 8px #FBBF2499",
            }}
            animate={{ opacity:[0.4,1,0.4], scale:[0.8,1.2,0.8] }}
            transition={{ duration:1.8, delay:i*0.36, repeat:Infinity, ease:"easeInOut" }}
          />
        );
      })}
    </div>
  );
}

/* ─── Plan card ──────────────────────────────────────────────────────────── */
function PlanCard({ plan, selected, onSelect }: { plan:Plan; selected:boolean; onSelect:()=>void }) {
  return (
    <motion.button
      whileTap={{ scale:0.97 }}
      onClick={onSelect}
      className="relative flex flex-col rounded-2xl p-4 text-left w-full overflow-hidden"
      style={{
        background: selected
          ? `linear-gradient(145deg, ${plan.color}22, rgba(10,15,30,0.9))`
          : "linear-gradient(145deg, rgba(10,15,30,0.85), rgba(26,16,64,0.7))",
        border: selected ? `2px solid ${plan.color}` : "1px solid rgba(255,255,255,0.07)",
        boxShadow: selected ? `0 0 28px ${plan.glow}` : "none",
        backdropFilter:"blur(12px)",
        cursor:"pointer",
        transition:"all 0.25s ease",
      }}
    >
      {/* Popular / Best value badge */}
      {plan.badge && (
        <div className="absolute -top-px right-3">
          <div className="px-2 py-0.5 rounded-b-lg"
            style={{
              background: plan.popular
                ? "linear-gradient(90deg, #D97706, #FBBF24)"
                : "linear-gradient(90deg, #5B21B6, #7C3AED)",
              fontFamily:"'Rajdhani', sans-serif", fontWeight:800,
              fontSize:"0.55rem", color:plan.popular?"#111827":"#fff",
              letterSpacing:"0.08em",
            }}>
            {plan.badge}
          </div>
        </div>
      )}

      {/* Selected indicator */}
      <div className="absolute top-3 right-3">
        <div className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{
            background: selected ? plan.color : "rgba(255,255,255,0.07)",
            border:`1.5px solid ${selected ? plan.color : "rgba(255,255,255,0.12)"}`,
            transition:"all 0.2s",
          }}>
          {selected && <Check size={11} style={{ color:"#111827" }} strokeWidth={3} />}
        </div>
      </div>

      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem",
        color: selected ? plan.color : "#9CA3AF", letterSpacing:"0.08em" }}>
        {plan.label.toUpperCase()}
      </span>

      <div className="flex items-baseline gap-1 mt-0.5">
        <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize:"1.5rem",
          color: selected ? plan.color : "#F0F4FF" }}>
          {plan.price}
        </span>
        <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.65rem", color:"#6B7280" }}>
          {plan.per}
        </span>
      </div>

      {plan.original && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.62rem",
            color:"#4B5563", textDecoration:"line-through" }}>
            {plan.original}
          </span>
          <span className="px-1.5 py-0.5 rounded-md"
            style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.55rem",
              color:"#34D399", background:"rgba(52,211,153,0.15)", border:"1px solid rgba(52,211,153,0.3)" }}>
            {plan.save}
          </span>
        </div>
      )}
    </motion.button>
  );
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Props { onBack: () => void; userPoints: number; }

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export function VIPPage({ onBack, userPoints }: Props) {
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  const handleSubscribe = () => setSubscribed(true);

  if (subscribed) {
    return <SuccessScreen plan={plan} onBack={onBack} />;
  }

  return (
    <div className="flex flex-col gap-5 pb-2 relative">
      <GoldParticles />
      <div className="relative flex flex-col gap-5" style={{ zIndex:1 }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <motion.button whileTap={{ scale:0.92 }} onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)", color:"#FBBF24", cursor:"pointer" }}>
            <ArrowLeft size={15} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.82rem" }}>Back</span>
          </motion.button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)" }}>
            <span style={{ fontSize:"0.8rem" }}>🪙</span>
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.82rem", color:"#FBBF24" }}>
              {userPoints.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
          className="relative rounded-3xl overflow-hidden flex flex-col items-center px-6 pb-6"
          style={{
            background:"linear-gradient(145deg, rgba(30,14,50,0.97) 0%, rgba(10,15,30,0.97) 100%)",
            border:"1.5px solid rgba(251,191,36,0.35)",
            boxShadow:"0 0 80px rgba(251,191,36,0.15), 0 0 120px rgba(109,40,217,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
            backdropFilter:"blur(20px)",
          }}
        >
          {/* BG blob */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl opacity-25"
            style={{ background:"radial-gradient(ellipse, #FBBF24 0%, #6D28D9 100%)" }} />

          <CrownHero />

          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
            className="flex flex-col items-center gap-2 relative text-center">
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize:"1.55rem",
              background:"linear-gradient(90deg, #FBBF24, #F59E0B, #FBBF24)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              letterSpacing:"0.04em", lineHeight:1.15 }}>
              BECOME A VIP MEMBER
            </span>
            <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.82rem", color:"#9CA3AF",
              lineHeight:1.6, maxWidth:280, margin:0 }}>
              Unlock the full Quizora experience. Double your points, remove ads, and access exclusive content.
            </p>

            {/* Social proof */}
            <div className="flex items-center gap-1.5 mt-1">
              {["🦊","🧠","👑","🌟","⚡"].map((e, i) => (
                <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ background:"rgba(109,40,217,0.3)", border:"1px solid rgba(167,139,250,0.3)", marginLeft: i ? -6 : 0 }}>
                  {e}
                </div>
              ))}
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.65rem", color:"#9CA3AF", marginLeft:4 }}>
                12,400+ VIP members
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* ── BENEFITS GRID ────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} style={{ color:"#FBBF24" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.75rem", color:"#6B7280", letterSpacing:"0.1em" }}>
              VIP BENEFITS
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div key={b.label}
                  initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                  className="flex items-start gap-2.5 px-3 py-3 rounded-xl"
                  style={{
                    background:"linear-gradient(135deg, rgba(10,15,30,0.88), rgba(26,16,64,0.7))",
                    border:`1px solid ${b.color}25`,
                    boxShadow:`0 0 12px ${b.color}08`,
                    backdropFilter:"blur(8px)",
                  }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background:`${b.color}20`, border:`1px solid ${b.color}44` }}>
                    <Icon size={13} style={{ color:b.color }} />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.75rem", color:"#F0F4FF", margin:0, lineHeight:1.25 }}>
                      {b.label}
                    </p>
                    <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.6rem", color:"#6B7280", margin:0, marginTop:2, lineHeight:1.4 }}>
                      {b.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── PLAN SELECTOR ────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Crown size={14} style={{ color:"#FBBF24" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.75rem", color:"#6B7280", letterSpacing:"0.1em" }}>
              CHOOSE YOUR PLAN
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {PLANS.map((p) => (
              <PlanCard key={p.id} plan={p} selected={selectedPlan===p.id} onSelect={() => setSelectedPlan(p.id)} />
            ))}
          </div>
        </div>

        {/* ── SUBSCRIBE BUTTON ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2.5">
          <motion.button
            whileTap={{ scale:0.97 }}
            onClick={handleSubscribe}
            className="flex items-center justify-center gap-2.5 py-4 rounded-2xl w-full relative overflow-hidden"
            style={{
              background:"linear-gradient(135deg, #92400E, #D97706, #FBBF24, #D97706, #92400E)",
              backgroundSize:"200%",
              border:"1.5px solid rgba(251,191,36,0.55)",
              boxShadow:"0 0 40px rgba(251,191,36,0.5), 0 0 80px rgba(109,40,217,0.2)",
              cursor:"pointer",
            }}
          >
            {/* Shimmer sweep */}
            <motion.div
              animate={{ x:["-100%","200%"] }}
              transition={{ duration:2.5, repeat:Infinity, ease:"linear" }}
              className="absolute inset-0"
              style={{ background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", width:"50%" }}
            />
            <Crown size={20} style={{ color:"#111827" }} strokeWidth={2} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize:"1.05rem", color:"#111827", letterSpacing:"0.06em", position:"relative" }}>
              SUBSCRIBE NOW — {plan.price}{plan.per.split("/")[1] ? " /"+plan.per.split("/")[1] : ""}
            </span>
          </motion.button>

          <div className="grid grid-cols-2 gap-2">
            <motion.button whileTap={{ scale:0.97 }}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl"
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", cursor:"pointer" }}>
              <RefreshCw size={13} style={{ color:"#6B7280" }} />
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.75rem", color:"#6B7280" }}>
                Restore Purchase
              </span>
            </motion.button>
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => setShowLearnMore((s) => !s)}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl"
              style={{ background:"rgba(109,40,217,0.1)", border:"1px solid rgba(109,40,217,0.25)", cursor:"pointer" }}>
              <Info size={13} style={{ color:"#A78BFA" }} />
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.75rem", color:"#A78BFA" }}>
                Learn More
              </span>
            </motion.button>
          </div>
        </div>

        {/* Learn More expandable */}
        <AnimatePresence>
          {showLearnMore && (
            <motion.div
              initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl px-4 py-4"
                style={{ background:"rgba(10,15,30,0.85)", border:"1px solid rgba(109,40,217,0.22)", backdropFilter:"blur(8px)" }}>
                {[
                  "Cancel anytime — no long-term commitment required.",
                  "VIP status activates immediately after payment.",
                  "Yearly subscribers receive a permanent VIP profile frame.",
                  "Points earned during VIP are yours to keep even after cancellation.",
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                    <Check size={12} style={{ color:"#34D399", flexShrink:0, marginTop:2 }} />
                    <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.75rem", color:"#9CA3AF", lineHeight:1.55 }}>{t}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── COMPARISON TABLE ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} style={{ color:"#22D3EE" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.75rem", color:"#6B7280", letterSpacing:"0.1em" }}>
              FREE vs VIP
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden"
            style={{
              background:"linear-gradient(145deg, rgba(10,15,30,0.9), rgba(26,16,64,0.8))",
              border:"1px solid rgba(109,40,217,0.25)",
              backdropFilter:"blur(12px)",
            }}>
            {/* Header row */}
            <div className="flex items-center gap-2 px-4 py-2.5"
              style={{ background:"rgba(109,40,217,0.15)", borderBottom:"1px solid rgba(109,40,217,0.2)" }}>
              <span className="flex-1" style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.68rem", color:"#6B7280", letterSpacing:"0.06em" }}>
                FEATURE
              </span>
              <div className="flex items-center gap-1 w-16 justify-center">
                <Lock size={10} style={{ color:"#6B7280" }} />
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.65rem", color:"#6B7280" }}>FREE</span>
              </div>
              <div className="flex items-center gap-1 w-16 justify-center">
                <Crown size={10} style={{ color:"#FBBF24" }} />
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.65rem", color:"#FBBF24" }}>VIP</span>
              </div>
            </div>

            {COMPARISON.map((row, i) => {
              const freeVal  = typeof row.free  === "boolean" ? null : row.free;
              const vipVal   = typeof row.vip   === "boolean" ? null : row.vip;
              const freeHas  = typeof row.free  === "boolean" ? row.free  : true;
              const vipHas   = typeof row.vip   === "boolean" ? row.vip   : true;
              const isAd     = row.feature === "Ads";

              return (
                <motion.div
                  key={row.feature}
                  initial={{ opacity:0, x:-8 }}
                  animate={{ opacity:1, x:0 }}
                  transition={{ delay:i*0.04 }}
                  className="flex items-center gap-2 px-4 py-2.5"
                  style={{ borderBottom: i < COMPARISON.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                >
                  <span className="flex-1" style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.75rem", color:"#9CA3AF" }}>
                    {row.feature}
                  </span>

                  {/* Free cell */}
                  <div className="w-16 flex items-center justify-center">
                    {freeVal ? (
                      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.65rem", color:"#6B7280" }}>{freeVal}</span>
                    ) : isAd ? (
                      /* Ads: free has ads (bad), vip doesn't */
                      <X size={14} style={{ color:"#F87171" }} />
                    ) : freeHas ? (
                      <Check size={14} style={{ color:"#34D399" }} />
                    ) : (
                      <X size={14} style={{ color:"#F87171" }} />
                    )}
                  </div>

                  {/* VIP cell */}
                  <div className="w-16 flex items-center justify-center">
                    {vipVal ? (
                      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.65rem", color:"#FBBF24" }}>{vipVal}</span>
                    ) : isAd ? (
                      <Check size={14} style={{ color:"#34D399" }} />
                    ) : vipHas ? (
                      <motion.div animate={{ filter:["drop-shadow(0 0 0px #FBBF24)","drop-shadow(0 0 6px #FBBF24aa)","drop-shadow(0 0 0px #FBBF24)"] }}
                        transition={{ duration:2.5, repeat:Infinity, delay:i*0.1 }}>
                        <Check size={14} style={{ color:"#FBBF24" }} />
                      </motion.div>
                    ) : (
                      <X size={14} style={{ color:"#F87171" }} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Legal fine print */}
        <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.6rem", color:"#374151", textAlign:"center", lineHeight:1.6 }}>
          Subscriptions auto-renew unless cancelled 24h before the end of the period.
          Prices shown in USD. Manage in your account settings.
        </p>

      </div>
    </div>
  );
}

/* ─── Success screen ─────────────────────────────────────────────────────── */
function SuccessScreen({ plan, onBack }: { plan: Plan; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity:0, scale:0.94 }} animate={{ opacity:1, scale:1 }}
      className="flex flex-col items-center gap-6 py-8 relative"
    >
      <GoldParticles />
      <div className="relative z-10 flex flex-col items-center gap-6 w-full">
        <CrownHero />

        <motion.div
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="flex flex-col items-center gap-2 text-center px-4"
        >
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize:"1.6rem",
            background:"linear-gradient(90deg, #FBBF24, #F59E0B, #FBBF24)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"0.04em" }}>
            WELCOME TO VIP! 🎉
          </span>
          <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.85rem", color:"#9CA3AF", lineHeight:1.65, maxWidth:280, margin:0 }}>
            You are now a VIP member on the <strong style={{ color:plan.color }}>{plan.label}</strong> plan.
            All benefits are active immediately.
          </p>
        </motion.div>

        {/* Perks granted */}
        <div className="w-full px-4 flex flex-col gap-2">
          {["Double XP is now active","VIP badge added to your profile","Ads removed","3 bonus Lucky Box opens added"].map((perk, i) => (
            <motion.div key={i} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3+i*0.08 }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
              style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(52,211,153,0.2)", backdropFilter:"blur(8px)" }}>
              <Check size={14} style={{ color:"#34D399", flexShrink:0 }} />
              <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.8rem", color:"#D1FAE5" }}>{perk}</span>
            </motion.div>
          ))}
        </div>

        <motion.button whileTap={{ scale:0.97 }} onClick={onBack}
          className="flex items-center justify-center gap-2.5 py-4 rounded-2xl w-full mx-4 relative overflow-hidden"
          style={{
            background:"linear-gradient(135deg, #92400E, #D97706, #FBBF24)",
            border:"1.5px solid rgba(251,191,36,0.5)",
            boxShadow:"0 0 40px rgba(251,191,36,0.45), 0 0 80px rgba(109,40,217,0.15)",
            cursor:"pointer", maxWidth:360,
          }}>
          <motion.div animate={{ x:["-100%","200%"] }} transition={{ duration:2.5, repeat:Infinity, ease:"linear" }}
            className="absolute inset-0"
            style={{ background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", width:"50%" }} />
          <Crown size={18} style={{ color:"#111827" }} />
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:900, fontSize:"1rem", color:"#111827", letterSpacing:"0.05em" }}>
            START PLAYING AS VIP
          </span>
          <ChevronRight size={16} style={{ color:"#111827" }} />
        </motion.button>
      </div>
    </motion.div>
  );
}
