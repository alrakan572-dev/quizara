import { useEffect, useState } from "react";
import { AdminAPI, AdminAPIError, type AdminDashboardData } from "./AdminAPI";

const cardStyle = {
  background: "#182235",
  border: "1px solid rgba(167,139,250,.18)",
  borderRadius: 18,
  padding: 18,
} as const;

const inputStyle = {
  width: "100%",
  marginTop: 7,
  borderRadius: 10,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "white",
  padding: "10px 12px",
  boxSizing: "border-box",
} as const;

const cellStyle = {
  textAlign: "right",
  borderBottom: "1px solid #273449",
  padding: "11px 9px",
  whiteSpace: "nowrap",
} as const;

export function AdminPage({ onExit }: { onExit: () => void }) {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [botUsername, setBotUsername] = useState("");
  const [supportUsername, setSupportUsername] = useState("");
  const [adsEvery, setAdsEvery] = useState(3);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const next = await AdminAPI.dashboard();
      setData(next);
      setMaintenance(next.settings.maintenance_mode === "true");
      setBotUsername(next.settings.telegram_bot_username ?? "");
      setSupportUsername(next.settings.support_username ?? "");
      setAdsEvery(Math.max(1, Number(next.settings.ads_every_questions ?? 3)));
    } catch (unknownError) {
      setError(
        unknownError instanceof AdminAPIError && unknownError.status === 403
          ? "هذا الحساب غير مصرح له بدخول لوحة الإدارة."
          : unknownError instanceof Error
            ? unknownError.message
            : "تعذر تحميل لوحة الإدارة.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await AdminAPI.updateSettings({
        maintenance_mode: maintenance,
        telegram_bot_username: botUsername,
        support_username: supportUsername,
        ads_every_questions: adsEvery,
      });
      await load();
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "تعذر حفظ الإعدادات.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#0f1725", color: "#f8fafc", padding: 20, fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>لوحة إدارة Quizora</h1>
            <p style={{ color: "#94a3b8", margin: "6px 0 0" }}>إدارة إنتاجية محمية بجلسة Telegram وصلاحية مدير.</p>
          </div>
          <button onClick={onExit} style={{ border: 0, borderRadius: 12, padding: "10px 16px", cursor: "pointer" }}>العودة للتطبيق</button>
        </header>

        {loading && <div style={cardStyle}>جاري التحميل...</div>}
        {error && <div style={{ ...cardStyle, borderColor: "#ef4444", color: "#fecaca", marginBottom: 16 }}>{error}</div>}

        {data && (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 18 }}>
              {[
                ["المستخدمون", data.metrics.users],
                ["مستخدمون اليوم", data.metrics.new_users_today],
                ["VIP نشط", data.metrics.active_vip],
                ["الأسئلة", data.metrics.questions],
                ["الألغاز", data.metrics.riddles],
                ["فرق الصور", data.metrics.find_difference],
                ["محظورون", data.metrics.blocked_users],
              ].map(([label, value]) => (
                <div key={String(label)} style={cardStyle}>
                  <div style={{ color: "#94a3b8", fontSize: 13 }}>{label}</div>
                  <strong style={{ display: "block", fontSize: 26, marginTop: 8 }}>{Number(value).toLocaleString("ar")}</strong>
                </div>
              ))}
            </section>

            <section style={{ ...cardStyle, marginBottom: 18 }}>
              <h2 style={{ marginTop: 0 }}>إعدادات التشغيل</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
                <label>اسم مستخدم البوت<input value={botUsername} onChange={(event) => setBotUsername(event.target.value)} style={inputStyle} /></label>
                <label>حساب الدعم<input value={supportUsername} onChange={(event) => setSupportUsername(event.target.value)} style={inputStyle} /></label>
                <label>إعلان كل عدد أسئلة<input type="number" min={1} max={20} value={adsEvery} onChange={(event) => setAdsEvery(Number(event.target.value))} style={inputStyle} /></label>
                <label style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 26 }}><input type="checkbox" checked={maintenance} onChange={(event) => setMaintenance(event.target.checked)} /> وضع الصيانة</label>
              </div>
              <button disabled={saving} onClick={() => void save()} style={{ marginTop: 16, background: "#6d28d9", color: "white", border: 0, borderRadius: 12, padding: "11px 20px", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
              </button>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>أحدث المستخدمين</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                  <thead><tr>{["الاسم", "Telegram ID", "النقاط", "المستوى", "VIP", "الحالة", "التسجيل"].map((heading) => <th key={heading} style={cellStyle}>{heading}</th>)}</tr></thead>
                  <tbody>{data.recent_users.map((user) => (
                    <tr key={user.id}>
                      <td style={cellStyle}>{user.first_name || user.username || "—"}</td>
                      <td style={cellStyle}>{user.telegram_id}</td>
                      <td style={cellStyle}>{user.points}</td>
                      <td style={cellStyle}>{user.level ?? 1}</td>
                      <td style={cellStyle}>{user.vip ? "نعم" : "لا"}</td>
                      <td style={cellStyle}>{user.is_blocked ? "محظور" : "نشط"}</td>
                      <td style={cellStyle}>{new Date(user.created_at).toLocaleDateString("ar-SA")}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
