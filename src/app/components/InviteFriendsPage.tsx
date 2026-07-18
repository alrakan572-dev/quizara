import {
  useMemo,
  useState,
} from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Check,
  Copy,
  Gift,
  Share2,
  Users,
} from "lucide-react";

import { useReferral } from "../../hooks/useReferral";

interface Props {
  onBack: () => void;
  userPoints: number;
  onPointsUpdate: (points: number) => void;
}

export function InviteFriendsPage({
  onBack,
}: Props) {
  const {
    data,
    loading,
    error,
    refresh,
  } = useReferral();

  const [copied, setCopied] =
    useState<"code" | "link" | null>(null);

  const shareText = useMemo(() => {
    if (!data) return "";

    return `Join me on Quizora and earn rewards: ${data.referral.referral_url}`;
  }, [data]);

  if (loading && !data) {
    return (
      <StateCard
        emoji="🎁"
        message="Loading your referral program..."
      />
    );
  }

  if (error && !data) {
    return (
      <StateCard
        emoji="⚠️"
        message={error.message}
        action="TRY AGAIN"
        onAction={() =>
          void refresh()
        }
      />
    );
  }

  if (!data) {
    return (
      <StateCard
        emoji="⚠️"
        message="Referral data is unavailable."
      />
    );
  }

  const copy = async (
    value: string,
    type: "code" | "link",
  ) => {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(
      () => setCopied(null),
      1600,
    );
  };

  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join Quizora",
        text: shareText,
        url: data.referral.referral_url,
      });
      return;
    }

    await copy(
      data.referral.referral_url,
      "link",
    );
  };

  const telegramShareUrl =
    `https://t.me/share/url?url=${encodeURIComponent(
      data.referral.referral_url,
    )}&text=${encodeURIComponent(
      "Join me on Quizora!",
    )}`;

  const whatsappShareUrl =
    `https://wa.me/?text=${encodeURIComponent(
      shareText,
    )}`;

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl p-2"
          style={{
            background:
              "rgba(109,40,217,.15)",
            color: "#A78BFA",
          }}
          aria-label="Back"
        >
          <ArrowLeft size={17} />
        </button>

        <div>
          <h2
            style={{
              color: "#F9FAFB",
              fontWeight: 800,
              margin: 0,
            }}
          >
            Invite Friends
          </h2>
          <p
            style={{
              color: "#9CA3AF",
              fontSize: ".72rem",
              margin: 0,
            }}
          >
            Share your code and earn real points
          </p>
        </div>
      </div>

      <section
        className="rounded-3xl px-5 py-5 text-center"
        style={{
          background:
            "linear-gradient(145deg,#2D1B69,#111827)",
          border:
            "1px solid rgba(167,139,250,.35)",
          boxShadow:
            "0 0 36px rgba(109,40,217,.2)",
        }}
      >
        <Gift
          size={50}
          style={{
            color: "#FBBF24",
            margin: "0 auto 12px",
          }}
        />

        <h3
          style={{
            color: "#F9FAFB",
            margin: 0,
          }}
        >
          Your Referral Code
        </h3>

        <div
          className="mt-3 flex items-center justify-between rounded-2xl px-4 py-3"
          style={{
            background: "#111827",
            border:
              "1px solid rgba(251,191,36,.3)",
          }}
        >
          <strong
            style={{
              color: "#FBBF24",
              letterSpacing: ".12em",
            }}
          >
            {data.referral.referral_code}
          </strong>

          <button
            type="button"
            onClick={() =>
              void copy(
                data.referral.referral_code,
                "code",
              )
            }
            style={{
              color: "#A78BFA",
            }}
          >
            {copied === "code"
              ? <Check size={18} />
              : <Copy size={18} />}
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            void copy(
              data.referral.referral_url,
              "link",
            )
          }
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3"
          style={{
            background:
              "rgba(34,211,238,.1)",
            color: "#67E8F9",
          }}
        >
          {copied === "link"
            ? <Check size={17} />
            : <Copy size={17} />}
          {copied === "link"
            ? "LINK COPIED"
            : "COPY INVITE LINK"}
        </button>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <Stat
          label="Invited"
          value={data.stats.invited_count}
        />
        <Stat
          label="Registered"
          value={data.stats.registered_count}
        />
        <Stat
          label="Points Earned"
          value={data.stats.total_points_earned}
        />
      </div>

      <section
        className="rounded-2xl p-4"
        style={{
          background: "#1F2937",
          border:
            "1px solid rgba(109,40,217,.18)",
        }}
      >
        <h3
          style={{
            color: "#F9FAFB",
            marginTop: 0,
          }}
        >
          Share
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <ShareButton
            label="Telegram"
            onClick={() =>
              window.open(
                telegramShareUrl,
                "_blank",
                "noopener,noreferrer",
              )
            }
          />
          <ShareButton
            label="WhatsApp"
            onClick={() =>
              window.open(
                whatsappShareUrl,
                "_blank",
                "noopener,noreferrer",
              )
            }
          />
          <ShareButton
            label="More"
            onClick={() =>
              void nativeShare()
            }
          />
        </div>
      </section>

      <section
        className="rounded-2xl p-4"
        style={{
          background: "#1F2937",
          border:
            "1px solid rgba(109,40,217,.18)",
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <Users
            size={18}
            style={{
              color: "#A78BFA",
            }}
          />
          <h3
            style={{
              color: "#F9FAFB",
              margin: 0,
            }}
          >
            Invited Friends
          </h3>
        </div>

        {data.friends.length === 0 ? (
          <p
            style={{
              color: "#9CA3AF",
              fontSize: ".78rem",
            }}
          >
            No successful referrals yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.friends.map(
              (friend) => {
                const name =
                  friend.username ||
                  friend.first_name ||
                  "Quizora Player";

                return (
                  <motion.div
                    key={friend.claim_id}
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-3"
                    style={{
                      background: "#111827",
                    }}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl"
                      style={{
                        background:
                          "#1F2937",
                      }}
                    >
                      {friend.photo_url ? (
                        <img
                          src={friend.photo_url}
                          alt={name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        "🦊"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <strong
                        className="block truncate"
                        style={{
                          color: "#F9FAFB",
                        }}
                      >
                        {name}
                      </strong>
                      <span
                        style={{
                          color: "#6B7280",
                          fontSize: ".67rem",
                        }}
                      >
                        {formatDate(
                          friend.joined_at,
                        )}
                      </span>
                    </div>

                    <strong
                      style={{
                        color: "#34D399",
                        fontSize: ".75rem",
                      }}
                    >
                      +{friend.inviter_reward_points}
                    </strong>
                  </motion.div>
                );
              },
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="rounded-2xl px-3 py-4 text-center"
      style={{
        background: "#1F2937",
        border:
          "1px solid rgba(167,139,250,.18)",
      }}
    >
      <strong
        style={{
          color: "#F9FAFB",
          fontSize: "1.05rem",
        }}
      >
        {value.toLocaleString()}
      </strong>
      <div
        style={{
          color: "#9CA3AF",
          fontSize: ".63rem",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ShareButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl py-3"
      style={{
        background:
          "rgba(109,40,217,.12)",
        color: "#C4B5FD",
      }}
    >
      <Share2 size={17} />
      <span
        style={{
          fontSize: ".67rem",
          fontWeight: 700,
        }}
      >
        {label}
      </span>
    </button>
  );
}

function StateCard({
  emoji,
  message,
  action,
  onAction,
}: {
  emoji: string;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div
      className="rounded-2xl px-5 py-8 text-center"
      style={{
        background: "#1F2937",
        color: "#F9FAFB",
      }}
    >
      <div className="text-4xl">
        {emoji}
      </div>
      <p>{message}</p>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-xl px-4 py-2"
          style={{
            background: "#6D28D9",
            color: "white",
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

function formatDate(
  value: string,
): string {
  const date = new Date(value);

  return Number.isNaN(
    date.getTime(),
  )
    ? "Unknown"
    : date.toLocaleDateString();
}
