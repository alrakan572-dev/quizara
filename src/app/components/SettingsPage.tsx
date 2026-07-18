import {
  useEffect,
  useState,
} from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Globe,
  LogOut,
  Music2,
  Save,
  ShieldAlert,
  SunMoon,
  Volume2,
} from "lucide-react";

import { SessionStorage } from "../../auth";
import {
  type AppPreferenceLanguage,
  type AppTheme,
  type UserPreferences,
} from "../../api/SettingsAPI";
import { useSettings } from "../../hooks/useSettings";

interface Props {
  onBack: () => void;
}

export function SettingsPage({
  onBack,
}: Props) {
  const {
    data,
    loading,
    saving,
    deleting,
    error,
    refresh,
    save,
    requestDeletion,
    cancelDeletion,
  } = useSettings();

  const [preferences, setPreferences] =
    useState<UserPreferences>({
      language: "en",
      notifications_enabled: true,
      sound_enabled: true,
      music_enabled: false,
      theme: "dark",
    });

  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionMessage, setActionMessage] =
    useState<string | null>(null);

  useEffect(() => {
    if (data?.preferences) {
      setPreferences(data.preferences);
    }
  }, [data?.preferences]);

  const update = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) => {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setActionMessage(null);
    await save(preferences);
    setSaved(true);
  };

  const signOut = () => {
    SessionStorage.clear();
    window.dispatchEvent(
      new CustomEvent("quizara:session-expired"),
    );
  };

  const handleDelete = async () => {
    setActionMessage(null);
    const result = await requestDeletion();
    setConfirmDelete(false);
    setActionMessage(
      `Account deletion scheduled for ${formatDate(
        result.delete_scheduled_for,
      )}.`,
    );
  };

  const handleCancelDeletion = async () => {
    await cancelDeletion();
    setActionMessage("Account deletion was cancelled.");
  };

  if (loading && !data) {
    return <State message="Loading settings..." />;
  }

  if (error && !data) {
    return (
      <State
        message={error.message}
        action="TRY AGAIN"
        onAction={() => void refresh()}
      />
    );
  }

  const publicSettings = data?.public_settings ?? {};
  const deletionPending =
    Boolean(data?.account.deletion_pending);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={saving || deleting}
          className="rounded-xl p-2"
          style={{
            background: "rgba(109,40,217,.15)",
            color: "#A78BFA",
          }}
          aria-label="Back"
        >
          <ArrowLeft size={17} />
        </button>

        <div className="flex-1">
          <h2
            style={{
              color: "#F9FAFB",
              fontWeight: 800,
              margin: 0,
            }}
          >
            Settings
          </h2>
          <p
            style={{
              color: "#9CA3AF",
              fontSize: ".72rem",
              margin: 0,
            }}
          >
            Preferences are saved to your Quizora account
          </p>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => void handleSave()}
          disabled={saving}
          className="flex items-center gap-1 rounded-xl px-3 py-2"
          style={{
            background: saved
              ? "rgba(52,211,153,.15)"
              : "rgba(109,40,217,.2)",
            color: saved ? "#6EE7B7" : "#C4B5FD",
          }}
        >
          {saved ? (
            <CheckCircle2 size={15} />
          ) : (
            <Save size={15} />
          )}
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </motion.button>
      </div>

      <Section title="GENERAL">
        <SelectRow
          icon={<Globe size={16} />}
          label="Language"
          value={preferences.language}
          onChange={(value) =>
            update(
              "language",
              value as AppPreferenceLanguage,
            )
          }
          options={[
            ["en", "English"],
            ["ar", "العربية"],
          ]}
        />

        <SelectRow
          icon={<SunMoon size={16} />}
          label="Theme"
          value={preferences.theme}
          onChange={(value) =>
            update("theme", value as AppTheme)
          }
          options={[
            ["dark", "Dark"],
            ["light", "Light"],
          ]}
        />
      </Section>

      <Section title="AUDIO & NOTIFICATIONS">
        <ToggleRow
          icon={<Bell size={16} />}
          label="Notifications"
          value={preferences.notifications_enabled}
          onChange={(value) =>
            update("notifications_enabled", value)
          }
        />
        <ToggleRow
          icon={<Volume2 size={16} />}
          label="Sound effects"
          value={preferences.sound_enabled}
          onChange={(value) =>
            update("sound_enabled", value)
          }
        />
        <ToggleRow
          icon={<Music2 size={16} />}
          label="Background music"
          value={preferences.music_enabled}
          onChange={(value) =>
            update("music_enabled", value)
          }
        />
      </Section>

      <Section title="SUPPORT">
        <InfoRow
          label="App version"
          value={publicSettings.app_version ?? "1.0.0"}
        />
        <InfoRow
          label="Support"
          value={
            publicSettings.support_username
              ? `@${String(
                  publicSettings.support_username,
                ).replace(/^@/, "")}`
              : "Not configured"
          }
        />
        <InfoRow
          label="Telegram bot"
          value={
            publicSettings.telegram_bot_username
              ? `@${String(
                  publicSettings.telegram_bot_username,
                ).replace(/^@/, "")}`
              : "@quizor345bot"
          }
        />
      </Section>

      <Section title="ACCOUNT">
        {deletionPending && (
          <div
            className="rounded-xl px-4 py-3"
            style={{
              background: "rgba(251,191,36,.1)",
              color: "#FCD34D",
            }}
          >
            Account deletion is scheduled for{" "}
            {formatDate(data?.account.delete_scheduled_for ?? null)}.
            <button
              type="button"
              onClick={() => void handleCancelDeletion()}
              disabled={deleting}
              className="mt-3 w-full rounded-xl py-2"
              style={{
                background: "rgba(52,211,153,.15)",
                color: "#6EE7B7",
              }}
            >
              {deleting ? "Cancelling..." : "CANCEL DELETION"}
            </button>
          </div>
        )}

        {!deletionPending && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left"
            style={{
              background: "rgba(248,113,113,.08)",
              color: "#FCA5A5",
            }}
          >
            <ShieldAlert size={18} />
            <span>
              Request account deletion
              <small
                style={{
                  display: "block",
                  color: "#9CA3AF",
                }}
              >
                Grace period:{" "}
                {publicSettings.account_delete_days ?? "30"} days
              </small>
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={signOut}
          className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left"
          style={{
            background: "rgba(255,255,255,.05)",
            color: "#F9FAFB",
          }}
        >
          <LogOut size={18} />
          Sign out
        </button>
      </Section>

      {(error || actionMessage) && (
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: error
              ? "rgba(248,113,113,.1)"
              : "rgba(52,211,153,.1)",
            color: error ? "#FCA5A5" : "#6EE7B7",
          }}
        >
          {error?.message ?? actionMessage}
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: "rgba(0,0,0,.72)" }}
        >
          <div
            className="w-full max-w-sm rounded-3xl px-5 py-5"
            style={{
              background: "#111827",
              border: "1px solid rgba(248,113,113,.35)",
            }}
          >
            <h3 style={{ color: "#F9FAFB", marginTop: 0 }}>
              Schedule account deletion?
            </h3>
            <p style={{ color: "#9CA3AF", fontSize: ".8rem" }}>
              Your account will be scheduled for deletion after the
              configured grace period. You may cancel before that date.
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl py-3"
                style={{
                  background: "#374151",
                  color: "white",
                }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex-1 rounded-xl py-3"
                style={{
                  background: "#B91C1C",
                  color: "white",
                }}
              >
                {deleting ? "SCHEDULING..." : "CONFIRM"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div
        className="mb-2"
        style={{
          color: "#6B7280",
          fontSize: ".68rem",
          fontWeight: 700,
        }}
      >
        {title}
      </div>
      <div
        className="flex flex-col gap-2 rounded-2xl p-3"
        style={{
          background: "#1F2937",
          border: "1px solid rgba(109,40,217,.18)",
        }}
      >
        {children}
      </div>
    </section>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2">
      <span style={{ color: "#A78BFA" }}>{icon}</span>
      <span
        className="flex-1"
        style={{ color: "#F9FAFB", fontSize: ".82rem" }}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative rounded-full"
        style={{
          width: 44,
          height: 24,
          background: value ? "#6D28D9" : "#374151",
        }}
      >
        <span
          className="absolute top-1 h-4 w-4 rounded-full bg-white"
          style={{
            left: value ? 24 : 4,
            transition: "left .2s",
          }}
        />
      </button>
    </div>
  );
}

function SelectRow({
  icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl px-2 py-2">
      <span style={{ color: "#A78BFA" }}>{icon}</span>
      <span
        className="flex-1"
        style={{ color: "#F9FAFB", fontSize: ".82rem" }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          background: "#111827",
          color: "#F9FAFB",
          border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 10,
          padding: "7px 9px",
        }}
      >
        {options.map(([id, text]) => (
          <option key={id} value={id}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl px-2 py-2">
      <span style={{ color: "#9CA3AF", fontSize: ".78rem" }}>
        {label}
      </span>
      <strong style={{ color: "#F9FAFB", fontSize: ".78rem" }}>
        {value}
      </strong>
    </div>
  );
}

function State({
  message,
  action,
  onAction,
}: {
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div
      className="rounded-2xl px-5 py-8 text-center"
      style={{ background: "#1F2937", color: "#9CA3AF" }}
    >
      <p>{message}</p>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-xl px-4 py-2"
          style={{ background: "#6D28D9", color: "white" }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : date.toLocaleDateString();
}
