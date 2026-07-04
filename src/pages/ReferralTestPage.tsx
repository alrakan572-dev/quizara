import { useState } from "react";
import { useReferral } from "../hooks/useReferral";

export function ReferralTestPage() {
  const {
    invites,
    loading,
    processing,
    message,
    inviteUser,
    claimReward,
    refresh,
  } = useReferral(123456789);

  const [invitedId, setInvitedId] = useState("987654321");

  if (loading) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        Loading Referral...
      </div>
    );
  }

  return (
    <div style={{ color: "white", padding: 20 }}>
      <h2>Referral Test</h2>

      <p>Current User: 123456789</p>

      <input
        value={invitedId}
        onChange={(e) => setInvitedId(e.target.value)}
        placeholder="Invited Telegram ID"
        style={{ padding: 10, width: "100%", marginBottom: 12 }}
      />

      <button
        onClick={() => inviteUser(Number(invitedId))}
        disabled={processing}
      >
        Register Invite
      </button>

      <br />
      <br />

      <button
        onClick={() => claimReward(Number(invitedId))}
        disabled={processing}
      >
        Claim Referral Reward
      </button>

      <br />
      <br />

      <button onClick={refresh} disabled={processing}>
        Refresh
      </button>

      {message && <p>{message}</p>}

      <hr />

      <h3>Invites</h3>

      {invites.map((invite) => (
        <div
          key={invite.id}
          style={{
            border: "1px solid gray",
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <p>Invited ID: {invite.invited_id}</p>
          <p>Reward Points: {invite.reward_points}</p>
          <p>Reward Given: {invite.reward_given ? "Yes" : "No"}</p>
          <p>Created: {invite.created_at}</p>
        </div>
      ))}
    </div>
  );
}