import { useAdsReward } from "../hooks/useAdsReward";

export function AdsRewardTestPage() {
  const {
    rewardsToday,
    canWatch,
    loading,
    processing,
    claimAdReward,
    refresh,
  } = useAdsReward(123456789);

  if (loading) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        Loading Ads Reward...
      </div>
    );
  }

  return (
    <div style={{ color: "white", padding: 20 }}>
      <h2>Ads Reward Test</h2>

      <p>Can Watch Ad: {canWatch ? "Yes ✅" : "No ❌"}</p>
      <p>Rewards Today: {rewardsToday.length}</p>

      <button onClick={refresh} disabled={processing}>
        Refresh
      </button>

      <br />
      <br />

      <button
        onClick={() => claimAdReward("points", 10, "telegram")}
        disabled={!canWatch || processing}
      >
        Claim 10 Points Ad Reward
      </button>

      <br />
      <br />

      <button
        onClick={() => claimAdReward("coins", 5, "telegram")}
        disabled={!canWatch || processing}
      >
        Claim 5 Coins Ad Reward
      </button>

      <hr />

      <h3>Today Rewards</h3>

      {rewardsToday.map((reward) => (
        <div
          key={reward.id}
          style={{
            border: "1px solid gray",
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <p>Type: {reward.reward_type}</p>
          <p>Value: {reward.reward_value}</p>
          <p>Provider: {reward.ad_provider}</p>
          <p>Created: {reward.created_at}</p>
        </div>
      ))}
    </div>
  );
}