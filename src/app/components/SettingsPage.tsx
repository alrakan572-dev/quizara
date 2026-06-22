import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Globe, Bell, Volume2, Music2, Moon,
  Sun, Shield, FileText, Headphones, LogOut,
  ChevronRight, Check, Settings,
} from "lucide-react";

/* ─── Particles ─────────────────────────────────────────────────────────── */
function NeonParticles() {
  const p = Array.from({ length:14 }, (_, i) => ({
    id:i, x:Math.random()*100, y:Math.random()*100, size:1.5+Math.random()*2.5,
    color:i%3===0?"#6D28D9":i%3===1?"#22D3EE":"#A78BFA",
    dur:3+Math.random()*4, delay:Math.random()*3,
  }));
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex:0 }}>
      {p.map((pp) => (
        <motion.div key={pp.id} className="absolute rounded-full"
          style={{ left:`${pp.x}%`, top:`${pp.y}%`, width:pp.size, height:pp.size, background:pp.color, filter:"blur(1px)" }}
          animate={{ opacity:[0.08,0.45,0.08], y:[-7,7,-7], scale:[1,1.4,1] }}
          transition={{ duration:pp.dur, delay:pp.delay, repeat:Infinity, ease:"easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Neon Toggle ────────────────────────────────────────────────────────── */
function NeonToggle({ on, color, onChange }: { on: boolean; color: string; onChange: () => void }) {
  return (
    <motion.button
      whileTap={{ scale:0.92 }}
      onClick={onChange}
      className="relative flex-shrink-0"
      style={{ width:44, height:24, cursor:"pointer", background:"none", border:"none", padding:0 }}
    >
      <motion.div
        animate={{
          background: on
            ? `linear-gradient(90deg, ${color}cc, ${color})`
            : "rgba(55,65,81,0.8)",
          boxShadow: on ? `0 0 14px ${color}88` : "none",
        }}
        transition={{ duration:0.25 }}
        className="absolute inset-0 rounded-full"
        style={{ border:`1.5px solid ${on ? color : "rgba(255,255,255,0.1)"}` }}
      />
      <motion.div
        animate={{ x: on ? 22 : 2 }}
        transition={{ type:"spring", stiffness:320, damping:24 }}
        className="absolute top-1 w-4 h-4 rounded-full"
        style={{
          background: on ? "#fff" : "#6B7280",
          boxShadow: on ? `0 0 8px ${color}` : "none",
        }}
      />
    </motion.button>
  );
}

/* ─── Pill Selector ──────────────────────────────────────────────────────── */
function PillSelector<T extends string>({
  options, value, color, onChange,
}: { options: { id: T; label: string }[]; value: T; color: string; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-xl p-0.5 gap-0.5"
      style={{ background:"rgba(10,15,30,0.7)", border:"1px solid rgba(255,255,255,0.07)" }}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <motion.button
            key={opt.id}
            whileTap={{ scale:0.95 }}
            onClick={() => onChange(opt.id)}
            className="px-3 py-1 rounded-lg"
            style={{
              background: active ? `${color}33` : "transparent",
              border: active ? `1px solid ${color}66` : "1px solid transparent",
              boxShadow: active ? `0 0 10px ${color}44` : "none",
              cursor:"pointer", transition:"all 0.2s",
            }}
          >
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem",
              color: active ? color : "#6B7280", transition:"color 0.2s" }}>
              {opt.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─── Section wrapper ────────────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.68rem",
        color:"#6B7280", letterSpacing:"0.1em", marginBottom:8, paddingLeft:4 }}>
        {title}
      </p>
      <div className="rounded-2xl overflow-hidden"
        style={{
          background:"linear-gradient(145deg, rgba(10,15,30,0.9), rgba(26,16,64,0.75))",
          border:"1px solid rgba(109,40,217,0.2)",
          backdropFilter:"blur(12px)",
        }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Row types ──────────────────────────────────────────────────────────── */
function RowDivider() {
  return <div style={{ height:1, background:"rgba(255,255,255,0.04)", margin:"0 16px" }} />;
}

function ToggleRow({ icon: Icon, label, desc, on, color, onChange }: {
  icon: typeof Bell; label: string; desc?: string; on: boolean; color: string; onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background:`${color}20`, border:`1px solid ${color}44` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily:"'Inter', sans-serif", fontWeight:500, fontSize:"0.88rem", color:"#F0F4FF", margin:0 }}>{label}</p>
        {desc && <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.62rem", color:"#6B7280", margin:0 }}>{desc}</p>}
      </div>
      <NeonToggle on={on} color={color} onChange={onChange} />
    </div>
  );
}

function PillRow<T extends string>({ icon: Icon, label, options, value, color, onChange }: {
  icon: typeof Globe; label: string; options: { id: T; label: string }[]; value: T; color: string; onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background:`${color}20`, border:`1px solid ${color}44` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <span className="flex-1" style={{ fontFamily:"'Inter', sans-serif", fontWeight:500, fontSize:"0.88rem", color:"#F0F4FF" }}>
        {label}
      </span>
      <PillSelector options={options} value={value} color={color} onChange={onChange} />
    </div>
  );
}

function LinkRow({ icon: Icon, label, color, danger, onClick }: {
  icon: typeof Shield; label: string; color: string; danger?: boolean; onClick?: () => void;
}) {
  return (
    <motion.button whileTap={{ scale:0.98 }} onClick={onClick}
      className="flex items-center gap-3 px-4 py-3.5 w-full text-left"
      style={{ background:"none", border:"none", cursor:"pointer" }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background:`${color}20`, border:`1px solid ${color}44` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <span className="flex-1" style={{ fontFamily:"'Inter', sans-serif", fontWeight:500, fontSize:"0.88rem",
        color: danger ? color : "#F0F4FF" }}>
        {label}
      </span>
      <ChevronRight size={15} style={{ color:"#374151" }} />
    </motion.button>
  );
}

/* ─── Logout confirm modal ───────────────────────────────────────────────── */
function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 flex items-end justify-center"
      style={{ zIndex:200, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ y:120, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:120, opacity:0 }}
        transition={{ type:"spring", stiffness:260, damping:24 }}
        className="w-full max-w-sm mx-4 mb-6 rounded-3xl overflow-hidden"
        style={{
          background:"linear-gradient(145deg, rgba(26,16,64,0.99), rgba(10,15,30,0.99))",
          border:"1.5px solid rgba(239,68,68,0.35)",
          boxShadow:"0 0 60px rgba(239,68,68,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-3 px-6 py-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.35)" }}>
            🚪
          </div>
          <div className="text-center">
            <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.1rem", color:"#F0F4FF", margin:0 }}>
              Sign Out?
            </p>
            <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.78rem", color:"#9CA3AF", margin:"6px 0 0" }}>
              You'll need to sign in again to access your profile and progress.
            </p>
          </div>
          <div className="flex gap-2.5 w-full mt-1">
            <motion.button whileTap={{ scale:0.96 }} onClick={onCancel}
              className="flex-1 py-3 rounded-xl"
              style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer" }}>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.9rem", color:"#9CA3AF" }}>
                Cancel
              </span>
            </motion.button>
            <motion.button whileTap={{ scale:0.96 }} onClick={onConfirm}
              className="flex-1 py-3 rounded-xl"
              style={{ background:"rgba(239,68,68,0.2)", border:"1px solid rgba(239,68,68,0.45)",
                boxShadow:"0 0 16px rgba(239,68,68,0.25)", cursor:"pointer" }}>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.9rem", color:"#F87171" }}>
                Sign Out
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Props { onBack: () => void; }
type Language = "en" | "ar";
type Theme    = "dark" | "light";

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════════ */
export function SettingsPage({ onBack }: Props) {
  const [language,  setLanguage]  = useState<Language>("en");
  const [notifs,    setNotifs]    = useState(true);
  const [sound,     setSound]     = useState(true);
  const [music,     setMusic]     = useState(false);
  const [theme,     setTheme]     = useState<Theme>("dark");
  const [showLogout,setShowLogout]= useState(false);
  const [savedAnim, setSavedAnim] = useState(false);

  const handleSave = () => {
    setSavedAnim(true);
    setTimeout(() => setSavedAnim(false), 2000);
  };

  return (
    <>
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
              <Settings size={16} style={{ color:"#A78BFA" }} />
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1rem", color:"#F0F4FF", letterSpacing:"0.04em" }}>
                SETTINGS
              </span>
            </div>
            {/* Save button */}
            <motion.button whileTap={{ scale:0.92 }} onClick={handleSave}
              className="flex items-center gap-1 px-3 py-2 rounded-xl"
              style={{
                background: savedAnim ? "rgba(52,211,153,0.2)" : "rgba(109,40,217,0.15)",
                border: savedAnim ? "1px solid rgba(52,211,153,0.5)" : "1px solid rgba(109,40,217,0.35)",
                cursor:"pointer", transition:"all 0.2s",
              }}>
              <AnimatePresence mode="wait">
                {savedAnim
                  ? <motion.div key="saved" initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}
                      className="flex items-center gap-1">
                      <Check size={13} style={{ color:"#34D399" }} />
                      <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#34D399" }}>
                        Saved
                      </span>
                    </motion.div>
                  : <motion.span key="save" initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}
                      style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.72rem", color:"#A78BFA" }}>
                      Save
                    </motion.span>
                }
              </AnimatePresence>
            </motion.button>
          </motion.div>

          {/* ── GENERAL ──────────────────────────────────────────────────── */}
          <Section title="GENERAL">
            <PillRow
              icon={Globe} label="Language"
              options={[{ id:"en" as Language, label:"English" }, { id:"ar" as Language, label:"العربية" }]}
              value={language} color="#22D3EE" onChange={setLanguage}
            />
            <RowDivider />
            <PillRow
              icon={theme === "dark" ? Moon : Sun} label="Theme"
              options={[{ id:"dark" as Theme, label:"Dark" }, { id:"light" as Theme, label:"Light" }]}
              value={theme} color="#A78BFA" onChange={setTheme}
            />
          </Section>

          {/* ── NOTIFICATIONS & SOUND ────────────────────────────────────── */}
          <Section title="NOTIFICATIONS & SOUND">
            <ToggleRow
              icon={Bell} label="Push Notifications"
              desc="Game results, daily challenges, rewards"
              on={notifs} color="#6D28D9" onChange={() => setNotifs((s) => !s)}
            />
            <RowDivider />
            <ToggleRow
              icon={Volume2} label="Sound Effects"
              desc="Button taps, answer feedback, timers"
              on={sound} color="#22D3EE" onChange={() => setSound((s) => !s)}
            />
            <RowDivider />
            <ToggleRow
              icon={Music2} label="Background Music"
              desc="Ambient music during gameplay"
              on={music} color="#F97316" onChange={() => setMusic((s) => !s)}
            />
          </Section>

          {/* Preview: active settings */}
          <motion.div
            layout
            className="flex items-center gap-2 px-4 py-3 rounded-2xl"
            style={{
              background:"rgba(109,40,217,0.1)",
              border:"1px solid rgba(109,40,217,0.25)",
              backdropFilter:"blur(8px)",
            }}
          >
            <div className="flex-1 flex flex-wrap gap-1.5">
              {[
                { label: language === "en" ? "EN" : "AR",  color:"#22D3EE" },
                { label: theme === "dark" ? "🌙 Dark" : "☀️ Light", color:"#A78BFA" },
                { label: notifs ? "🔔 On"  : "🔕 Off",    color: notifs ? "#6D28D9" : "#6B7280" },
                { label: sound  ? "🔊 SFX" : "🔇 SFX",   color: sound  ? "#22D3EE" : "#6B7280" },
                { label: music  ? "🎵 Music" : "🎵 Off",  color: music  ? "#F97316" : "#6B7280" },
              ].map((chip) => (
                <span key={chip.label} className="px-2 py-0.5 rounded-full"
                  style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.62rem",
                    color:chip.color, background:`${chip.color}18`, border:`1px solid ${chip.color}33` }}>
                  {chip.label}
                </span>
              ))}
            </div>
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.6rem", color:"#4B5563" }}>ACTIVE</span>
          </motion.div>

          {/* ── ACCOUNT ──────────────────────────────────────────────────── */}
          <Section title="ACCOUNT">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                style={{ background:"rgba(109,40,217,0.2)", border:"1px solid rgba(167,139,250,0.35)" }}>
                🦊
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily:"'Inter', sans-serif", fontWeight:500, fontSize:"0.88rem", color:"#F0F4FF", margin:0 }}>
                  Alex_Quizmaster
                </p>
                <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.62rem", color:"#6B7280", margin:0 }}>
                  ID: #QZ-48291 · VIP Member
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full"
                style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.58rem",
                  color:"#FBBF24", background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.3)" }}>
                ⭐ VIP
              </span>
            </div>
          </Section>

          {/* ── LEGAL & SUPPORT ──────────────────────────────────────────── */}
          <Section title="LEGAL & SUPPORT">
            <LinkRow icon={Shield}       label="Privacy Policy"     color="#22D3EE" />
            <RowDivider />
            <LinkRow icon={FileText}     label="Terms of Service"   color="#A78BFA" />
            <RowDivider />
            <LinkRow icon={Headphones}   label="Contact Support"    color="#34D399" />
          </Section>

          {/* ── APP INFO ─────────────────────────────────────────────────── */}
          <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{ background:"rgba(10,15,30,0.6)", border:"1px solid rgba(255,255,255,0.05)" }}>
            <div>
              <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.75rem", color:"#6B7280", margin:0 }}>
                Quizora v2.4.1
              </p>
              <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.62rem", color:"#374151", margin:0 }}>
                Build 20260617 · Telegram Mini App
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background:"linear-gradient(135deg, #6D28D9, #4C1D95)" }}>
              <span style={{ fontSize:"1rem" }}>🧠</span>
            </div>
          </div>

          {/* ── LOGOUT ───────────────────────────────────────────────────── */}
          <motion.button
            whileTap={{ scale:0.97 }}
            onClick={() => setShowLogout(true)}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl w-full"
            style={{
              background:"rgba(239,68,68,0.1)",
              border:"1px solid rgba(239,68,68,0.35)",
              boxShadow:"0 0 20px rgba(239,68,68,0.08)",
              cursor:"pointer",
            }}
          >
            <LogOut size={16} style={{ color:"#F87171" }} />
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.95rem",
              color:"#F87171", letterSpacing:"0.04em" }}>
              SIGN OUT
            </span>
          </motion.button>

        </div>
      </div>

      {/* Logout confirmation modal */}
      <AnimatePresence>
        {showLogout && (
          <LogoutModal
            onConfirm={() => { setShowLogout(false); onBack(); }}
            onCancel={() => setShowLogout(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
