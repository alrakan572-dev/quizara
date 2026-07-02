import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Camera, CheckCircle2, Globe, User,
  FileText, Eye, EyeOff, ChevronDown, Zap,
  Trophy, Target, TrendingUp,
} from "lucide-react";

/* ─── Data ───────────────────────────────────────────────────────────────── */
const AVATARS = ["🦊","🐉","👑","🦅","🤖","🌸","🧙","🦁","🐺","🦋","🔮","🌙","⚡","🎮","🧠","🏆"];

const COUNTRIES = [
  { code:"US", flag:"🇺🇸", name:"United States" },
  { code:"GB", flag:"🇬🇧", name:"United Kingdom" },
  { code:"DE", flag:"🇩🇪", name:"Germany"        },
  { code:"FR", flag:"🇫🇷", name:"France"         },
  { code:"JP", flag:"🇯🇵", name:"Japan"          },
  { code:"KR", flag:"🇰🇷", name:"South Korea"    },
  { code:"BR", flag:"🇧🇷", name:"Brazil"         },
  { code:"CA", flag:"🇨🇦", name:"Canada"         },
  { code:"AU", flag:"🇦🇺", name:"Australia"      },
  { code:"IN", flag:"🇮🇳", name:"India"          },
  { code:"SA", flag:"🇸🇦", name:"Saudi Arabia"   },
  { code:"AE", flag:"🇦🇪", name:"UAE"            },
];

const LANGUAGES = [
  { id:"en", label:"English", native:"English" },
  { id:"ar", label:"Arabic",  native:"العربية" },
  { id:"de", label:"German",  native:"Deutsch" },
  { id:"fr", label:"French",  native:"Français" },
  { id:"ja", label:"Japanese",native:"日本語"   },
  { id:"ko", label:"Korean",  native:"한국어"   },
];

/* ─── Particles ─────────────────────────────────────────────────────────── */
function NeonParticles() {
  const pts = Array.from({ length:16 }, (_, i) => ({
    id:i, x:Math.random()*100, y:Math.random()*100, size:1.5+Math.random()*2.5,
    color:i%3===0?"#6D28D9":i%3===1?"#22D3EE":"#A78BFA",
    dur:3+Math.random()*4, delay:Math.random()*3,
  }));
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex:0 }}>
      {pts.map((p) => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size, background:p.color, filter:"blur(1px)" }}
          animate={{ opacity:[0.08,0.45,0.08], y:[-7,7,-7], scale:[1,1.4,1] }}
          transition={{ duration:p.dur, delay:p.delay, repeat:Infinity, ease:"easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Neon input ─────────────────────────────────────────────────────────── */
function NeonInput({
  label, value, onChange, placeholder, maxLength, multiline, icon: Icon, color = "#A78BFA",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; maxLength?: number; multiline?: boolean;
  icon?: typeof User; color?: string;
}) {
  const [focused, setFocused] = useState(false);
  const baseStyle: React.CSSProperties = {
    width:"100%", background:"rgba(10,15,30,0.85)",
    border:`1.5px solid ${focused ? color : "rgba(255,255,255,0.08)"}`,
    borderRadius:12, padding:"10px 14px 10px 36px",
    color:"#F0F4FF", outline:"none",
    fontFamily:"'Inter', sans-serif", fontSize:"0.88rem",
    boxShadow: focused ? `0 0 16px ${color}33` : "none",
    transition:"border-color 0.2s, box-shadow 0.2s",
    resize:"none" as const,
  };
  return (
    <div>
      <label style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.68rem",
        color:"#6B7280", letterSpacing:"0.08em", display:"block", marginBottom:6 }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon size={14} style={{ color: focused ? color : "#4B5563", position:"absolute",
            left:12, top:multiline ? 12 : "50%", transform: multiline ? "none" : "translateY(-50%)",
            transition:"color 0.2s", zIndex:1 }} />
        )}
        {multiline ? (
          <textarea value={value} rows={3}
            onChange={(e) => onChange(e.target.value.slice(0, maxLength ?? 999))}
            placeholder={placeholder} style={baseStyle}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
        ) : (
          <input value={value} type="text"
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder} style={baseStyle}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
        )}
        {maxLength && (
          <span style={{ position:"absolute", right:10, bottom:10,
            fontFamily:"'Rajdhani', sans-serif", fontSize:"0.55rem",
            color: value.length >= maxLength ? "#F87171" : "#4B5563" }}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Dropdown ───────────────────────────────────────────────────────────── */
function NeonDropdown<T extends { name?: string; label?: string; flag?: string; native?: string }>({
  label, options, value, onSelect, color = "#A78BFA", displayKey,
}: {
  label: string; options: T[]; value: T; onSelect: (v: T) => void;
  color?: string; displayKey: keyof T;
}) {
  const [open, setOpen] = useState(false);
  const display = (v: T) => {
    const flag = (v as any).flag ?? "";
    const text = String(v[displayKey]);
    return flag ? `${flag} ${text}` : text;
  };
  return (
    <div className="relative">
      <label style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.68rem",
        color:"#6B7280", letterSpacing:"0.08em", display:"block", marginBottom:6 }}>
        {label}
      </label>
      <motion.button whileTap={{ scale:0.98 }} onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl"
        style={{
          background:"rgba(10,15,30,0.85)",
          border:`1.5px solid ${open ? color : "rgba(255,255,255,0.08)"}`,
          boxShadow: open ? `0 0 16px ${color}33` : "none",
          cursor:"pointer", transition:"all 0.2s",
        }}>
        <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.88rem", color:"#F0F4FF" }}>
          {display(value)}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration:0.2 }}>
          <ChevronDown size={14} style={{ color:"#6B7280" }} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:-8, scale:0.97 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-8, scale:0.97 }}
            transition={{ duration:0.18 }}
            className="absolute left-0 right-0 top-full mt-1 rounded-2xl overflow-hidden z-50 max-h-52 overflow-y-auto"
            style={{
              background:"rgba(10,15,30,0.98)",
              border:`1px solid ${color}44`,
              boxShadow:`0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${color}22`,
              backdropFilter:"blur(16px)",
              scrollbarWidth:"none",
            }}
          >
            {options.map((opt, i) => {
              const active = JSON.stringify(opt) === JSON.stringify(value);
              return (
                <motion.button key={i} whileTap={{ scale:0.98 }}
                  onClick={() => { onSelect(opt); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left"
                  style={{
                    background: active ? `${color}22` : "transparent",
                    borderBottom:"1px solid rgba(255,255,255,0.04)",
                    cursor:"pointer", transition:"background 0.15s",
                  }}>
                  <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.82rem",
                    color: active ? color : "#D1D5DB" }}>
                    {display(opt)}
                  </span>
                  {(opt as any).native && (
                    <span style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.72rem", color:"#6B7280", marginLeft:"auto" }}>
                      {(opt as any).native}
                    </span>
                  )}
                  {active && <CheckCircle2 size={12} style={{ color, flexShrink:0 }} />}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Neon Toggle ────────────────────────────────────────────────────────── */
function NeonToggle({ on, onChange, color = "#6D28D9" }: { on:boolean; onChange:()=>void; color?:string }) {
  return (
    <motion.button whileTap={{ scale:0.92 }} onClick={onChange}
      style={{ width:44, height:24, background:"none", border:"none", padding:0, cursor:"pointer", flexShrink:0 }}>
      <motion.div animate={{ background: on ? `linear-gradient(90deg, ${color}cc, ${color})` : "rgba(55,65,81,0.8)",
        boxShadow: on ? `0 0 14px ${color}88` : "none" }}
        transition={{ duration:0.25 }} className="absolute inset-0 rounded-full"
        style={{ position:"relative", height:24, border:`1.5px solid ${on ? color : "rgba(255,255,255,0.1)"}` }}>
        <motion.div animate={{ x: on ? 22 : 2 }}
          transition={{ type:"spring", stiffness:320, damping:24 }}
          style={{ position:"absolute", top:3, width:14, height:14, borderRadius:"50%",
            background: on ? "#fff" : "#6B7280", boxShadow: on ? `0 0 8px ${color}` : "none" }}
        />
      </motion.div>
    </motion.button>
  );
}

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface Props { onBack: () => void; userPoints: number; }

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════════ */
export function EditProfilePage({ onBack, userPoints }: Props) {
  const [avatar,      setAvatar]      = useState("🦊");
  const [username,    setUsername]    = useState("Alex_Quizmaster");
  const [displayName, setDisplayName] = useState("Alex");
  const [bio,         setBio]         = useState("Quiz enthusiast. Speed matters. 🏆");
  const [country,     setCountry]     = useState(COUNTRIES[0]);
  const [language,    setLanguage]    = useState(LANGUAGES[0]);
  const [publicProf,  setPublicProf]  = useState(true);
  const [showAvatars, setShowAvatars] = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [saving,      setSaving]      = useState(false);

  const isDirty = username !== "Alex_Quizmaster" || displayName !== "Alex"
    || bio !== "Quiz enthusiast. Speed matters. 🏆" || avatar !== "🦊"
    || country.code !== "US" || language.id !== "en" || !publicProf;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2800);
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
          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1rem", color:"#F0F4FF", letterSpacing:"0.04em" }}>
            EDIT PROFILE
          </span>
          <div style={{ width:64 }} />
        </motion.div>

        {/* ── AVATAR SECTION ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.04 }}
          className="relative rounded-3xl overflow-hidden flex flex-col items-center py-6 px-5"
          style={{
            background:"linear-gradient(145deg, rgba(26,16,64,0.97), rgba(10,15,30,0.97))",
            border:"1.5px solid rgba(109,40,217,0.38)",
            boxShadow:"0 0 60px rgba(109,40,217,0.18), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter:"blur(20px)",
          }}>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-24 rounded-full blur-3xl opacity-22"
            style={{ background:"radial-gradient(ellipse, #6D28D9 0%, #22D3EE 100%)" }} />

          {/* Avatar circle */}
          <div className="relative mb-3">
            <motion.div
              animate={{ boxShadow:["0 0 18px #6D28D966","0 0 38px #6D28D999","0 0 18px #6D28D966"] }}
              transition={{ duration:2.4, repeat:Infinity, ease:"easeInOut" }}
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background:"linear-gradient(135deg, #4C1D95, #6D28D9)",
                border:"3px solid rgba(167,139,250,0.55)",
                fontSize:"3.2rem",
              }}
            >
              {avatar}
            </motion.div>
            {/* Camera button */}
            <motion.button whileTap={{ scale:0.9 }}
              onClick={() => setShowAvatars((s) => !s)}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background:"linear-gradient(135deg, #6D28D9, #22D3EE)",
                border:"2px solid #111827",
                cursor:"pointer",
                boxShadow:"0 0 12px rgba(34,211,238,0.4)",
              }}>
              <Camera size={14} style={{ color:"#fff" }} />
            </motion.button>
          </div>

          <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1.05rem", color:"#F0F4FF" }}>
            {displayName || username}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.65rem", color:"#6B7280" }}>
              @{username}
            </span>
            <span style={{ fontSize:"0.75rem" }}>{country.flag}</span>
          </div>

          {/* Avatar grid */}
          <AnimatePresence>
            {showAvatars && (
              <motion.div
                initial={{ opacity:0, height:0, marginTop:0 }}
                animate={{ opacity:1, height:"auto", marginTop:16 }}
                exit={{ opacity:0, height:0, marginTop:0 }}
                transition={{ duration:0.28 }}
                className="overflow-hidden w-full"
              >
                <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.65rem",
                  color:"#6B7280", letterSpacing:"0.1em", textAlign:"center", marginBottom:10 }}>
                  CHOOSE AVATAR
                </p>
                <div className="grid grid-cols-8 gap-2">
                  {AVATARS.map((em) => (
                    <motion.button key={em} whileTap={{ scale:0.88 }}
                      onClick={() => { setAvatar(em); setShowAvatars(false); }}
                      className="aspect-square rounded-xl flex items-center justify-center"
                      style={{
                        background: avatar===em ? "rgba(109,40,217,0.4)" : "rgba(255,255,255,0.05)",
                        border: avatar===em ? "1.5px solid #A78BFA" : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: avatar===em ? "0 0 10px rgba(167,139,250,0.4)" : "none",
                        fontSize:"1.3rem", cursor:"pointer",
                      }}>
                      {em}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── FORM FIELDS ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.07 }}
          className="rounded-2xl px-4 py-4 flex flex-col gap-4"
          style={{
            background:"linear-gradient(145deg, rgba(10,15,30,0.9), rgba(26,16,64,0.75))",
            border:"1px solid rgba(109,40,217,0.22)",
            backdropFilter:"blur(12px)",
          }}>
          <NeonInput label="USERNAME" value={username} onChange={setUsername}
            placeholder="your_username" icon={User} color="#A78BFA" />
          <NeonInput label="DISPLAY NAME" value={displayName} onChange={setDisplayName}
            placeholder="Your Name" icon={User} color="#22D3EE" />
          <NeonInput label="BIO" value={bio} onChange={setBio}
            placeholder="Tell the world about yourself…" icon={FileText}
            color="#6D28D9" multiline maxLength={100} />
        </motion.div>

        {/* ── STATS CARD ───────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
          <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.68rem",
            color:"#6B7280", letterSpacing:"0.1em", marginBottom:8, paddingLeft:4 }}>
            YOUR STATISTICS
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label:"Total Points",  value:userPoints.toLocaleString(), icon:Zap,       color:"#FBBF24" },
              { label:"Games Played",  value:"342",                        icon:Trophy,    color:"#22D3EE" },
              { label:"Win Rate",      value:"74%",                        icon:Target,    color:"#34D399" },
              { label:"Current Rank",  value:"#12",                        icon:TrendingUp,color:"#A78BFA" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-2.5 px-3 py-3 rounded-xl"
                  style={{ background:"rgba(10,15,30,0.75)", border:`1px solid ${s.color}25`, backdropFilter:"blur(6px)" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background:`${s.color}20`, border:`1px solid ${s.color}44` }}>
                    <Icon size={13} style={{ color:s.color }} />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"0.95rem", color:s.color, margin:0, lineHeight:1 }}>
                      {s.value}
                    </p>
                    <p style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"0.55rem", color:"#6B7280", margin:0 }}>
                      {s.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── PREFERENCES ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.13 }}
          className="rounded-2xl px-4 py-4 flex flex-col gap-4"
          style={{
            background:"linear-gradient(145deg, rgba(10,15,30,0.9), rgba(26,16,64,0.75))",
            border:"1px solid rgba(109,40,217,0.22)",
            backdropFilter:"blur(12px)",
          }}>
          <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.68rem",
            color:"#6B7280", letterSpacing:"0.1em", margin:0 }}>
            PREFERENCES
          </p>
          <NeonDropdown label="COUNTRY" options={COUNTRIES} value={country}
            onSelect={setCountry} displayKey="name" color="#22D3EE" />
          <NeonDropdown label="LANGUAGE" options={LANGUAGES} value={language}
            onSelect={setLanguage} displayKey="label" color="#A78BFA" />

          {/* Public profile toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:700, fontSize:"0.75rem", color:"#F0F4FF", margin:0 }}>
                Public Profile
              </p>
              <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.62rem", color:"#6B7280", margin:0 }}>
                {publicProf ? "Your profile is visible to everyone" : "Your profile is private"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {publicProf
                ? <Eye size={13} style={{ color:"#22D3EE" }} />
                : <EyeOff size={13} style={{ color:"#6B7280" }} />}
              <NeonToggle on={publicProf} onChange={() => setPublicProf((s) => !s)} color="#22D3EE" />
            </div>
          </div>
        </motion.div>

        {/* ── SUCCESS BANNER ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity:0, y:-10, scale:0.95 }}
              animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:-10, scale:0.95 }}
              transition={{ type:"spring", stiffness:260, damping:20 }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{
                background:"linear-gradient(135deg, rgba(52,211,153,0.18), rgba(10,15,30,0.9))",
                border:"1.5px solid rgba(52,211,153,0.5)",
                boxShadow:"0 0 28px rgba(52,211,153,0.25)",
              }}
            >
              <motion.div
                animate={{ scale:[1,1.2,1], filter:["drop-shadow(0 0 4px #34D399)","drop-shadow(0 0 14px #34D399cc)","drop-shadow(0 0 4px #34D399)"] }}
                transition={{ duration:1.5, repeat:Infinity }}
              >
                <CheckCircle2 size={22} style={{ color:"#34D399", flexShrink:0 }} />
              </motion.div>
              <div>
                <p style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"0.95rem", color:"#34D399", margin:0 }}>
                  Profile Updated Successfully!
                </p>
                <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.65rem", color:"#9CA3AF", margin:0 }}>
                  Your changes have been saved.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BUTTONS ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2.5">
          <motion.button
            whileTap={{ scale:0.97 }}
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2.5 py-4 rounded-2xl w-full relative overflow-hidden"
            style={{
              background:"linear-gradient(135deg, #4C1D95, #6D28D9, #0E47A1)",
              border:"1.5px solid rgba(167,139,250,0.45)",
              boxShadow:"0 0 32px rgba(109,40,217,0.45), 0 0 60px rgba(34,211,238,0.1)",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.8 : 1,
            }}
          >
            {/* Shimmer */}
            {!saving && (
              <motion.div animate={{ x:["-100%","200%"] }}
                transition={{ duration:2.5, repeat:Infinity, ease:"linear" }}
                className="absolute inset-0"
                style={{ background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", width:"45%" }} />
            )}
            {saving ? (
              <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}
                className="w-5 h-5 rounded-full"
                style={{ border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff" }} />
            ) : (
              <CheckCircle2 size={18} style={{ color:"#22D3EE" }} />
            )}
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:800, fontSize:"1rem",
              color:"#fff", letterSpacing:"0.06em" }}>
              {saving ? "SAVING…" : "SAVE CHANGES"}
            </span>
          </motion.button>

          <motion.button whileTap={{ scale:0.97 }} onClick={onBack}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl w-full"
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", cursor:"pointer" }}>
            <span style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:"0.9rem", color:"#6B7280" }}>
              Cancel
            </span>
          </motion.button>
        </div>

      </div>
    </div>
  );
}
