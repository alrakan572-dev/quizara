import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2, Globe, Image, Save, User } from "lucide-react";
import { ProfileAPIError, type ProfileLanguage } from "../../api/ProfileAPI";
import { useProfile } from "../../hooks/useProfile";

const COUNTRIES = [["", "Not specified"], ["SA", "Saudi Arabia"], ["AE", "United Arab Emirates"], ["US", "United States"], ["GB", "United Kingdom"], ["CA", "Canada"], ["AU", "Australia"], ["DE", "Germany"], ["FR", "France"], ["JP", "Japan"], ["KR", "South Korea"], ["IN", "India"], ["BR", "Brazil"]] as const;
interface Props { onBack: () => void; userPoints: number; }

export function EditProfilePage({ onBack }: Props) {
  const { profile, loading, saving, error, save } = useProfile();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState<ProfileLanguage>("en");
  const [bio, setBio] = useState("");
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username ?? ""); setFirstName(profile.first_name ?? ""); setPhotoUrl(profile.photo_url ?? "");
    setCountry(profile.country ?? ""); setLanguage(profile.language ?? "en"); setBio(profile.bio ?? "");
  }, [profile]);

  async function submit() {
    setSuccess(false); setLocalError(null);
    const normalizedUsername = username.trim();
    if (normalizedUsername && !/^[A-Za-z0-9_]{3,24}$/.test(normalizedUsername)) {
      setLocalError("Username must contain 3–24 letters, numbers, or underscores."); return;
    }
    try {
      await save({ username: normalizedUsername || null, first_name: firstName.trim() || null, photo_url: photoUrl.trim() || null, country: country || null, language, bio: bio.trim() || null });
      setSuccess(true);
    } catch (value) {
      setLocalError(value instanceof ProfileAPIError ? value.message : "Unable to save profile");
    }
  }

  if (loading && !profile) return <div className="rounded-2xl px-5 py-8 text-center" style={{ background: "#1F2937", color: "#9CA3AF" }}>Loading profile...</div>;

  return <div className="flex flex-col gap-4 pb-4">
    <div className="flex items-center gap-3"><button type="button" onClick={onBack} disabled={saving} className="rounded-xl p-2" style={{ background: "rgba(109,40,217,.15)", color: "#A78BFA" }}><ArrowLeft size={17} /></button>
      <div><h2 style={{ color: "#F9FAFB", fontWeight: 800, margin: 0 }}>Edit Profile</h2><p style={{ color: "#9CA3AF", fontSize: ".72rem", margin: 0 }}>Changes are saved securely to Quizora</p></div>
    </div>

    <div className="flex flex-col gap-4 rounded-3xl px-4 py-5" style={{ background: "linear-gradient(145deg,#1F2937,#111827)", border: "1px solid rgba(167,139,250,.25)" }}>
      <Field label="USERNAME" icon={<User size={15} />}><input value={username} maxLength={24} onChange={e => setUsername(e.target.value)} placeholder="quizora_player" style={inputStyle} /></Field>
      <Field label="DISPLAY NAME" icon={<User size={15} />}><input value={firstName} maxLength={64} onChange={e => setFirstName(e.target.value)} placeholder="Your name" style={inputStyle} /></Field>
      <Field label="PHOTO URL" icon={<Image size={15} />}><input value={photoUrl} maxLength={1000} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://..." style={inputStyle} /></Field>
      <Field label="COUNTRY" icon={<Globe size={15} />}><select value={country} onChange={e => setCountry(e.target.value)} style={inputStyle}>{COUNTRIES.map(([code, name]) => <option key={code || "none"} value={code}>{name}</option>)}</select></Field>
      <Field label="LANGUAGE" icon={<Globe size={15} />}><select value={language} onChange={e => setLanguage(e.target.value as ProfileLanguage)} style={inputStyle}><option value="en">English</option><option value="ar">العربية</option></select></Field>
      <Field label={`BIO (${bio.length}/160)`} icon={<User size={15} />}><textarea value={bio} rows={4} maxLength={160} onChange={e => setBio(e.target.value)} placeholder="Tell players about yourself..." style={{ ...inputStyle, resize: "none" }} /></Field>
    </div>

    {(localError || error) && <div className="rounded-xl px-4 py-3" style={{ background: "rgba(248,113,113,.1)", color: "#FCA5A5" }}>{localError ?? error?.message}</div>}
    {success && <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "rgba(52,211,153,.1)", color: "#6EE7B7" }}><CheckCircle2 size={17} />Profile updated successfully</div>}
    <motion.button type="button" whileTap={{ scale: .97 }} onClick={() => void submit()} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl py-4"
      style={{ background: "linear-gradient(135deg,#6D28D9,#4C1D95)", color: "white", fontWeight: 800, opacity: saving ? .6 : 1 }}><Save size={18} />{saving ? "SAVING..." : "SAVE PROFILE"}</motion.button>
  </div>;
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <label><div className="mb-2 flex items-center gap-2" style={{ color: "#9CA3AF", fontSize: ".68rem", fontWeight: 700 }}>{icon}{label}</div>{children}</label>;
}
const inputStyle: React.CSSProperties = { width: "100%", background: "rgba(10,15,30,.85)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "11px 13px", color: "#F9FAFB", outline: "none" };
