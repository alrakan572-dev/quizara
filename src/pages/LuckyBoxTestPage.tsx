import { useLuckyBox } from "../hooks/useLuckyBox";

export function LuckyBoxTestPage() {
  const {
    rewards,
    selectedReward,
    loading,
    spinning,
    spin,
  } = useLuckyBox(123456789);

  if (loading) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        Loading Lucky Box...
      </div>
    );
  }

  return (
    <div
      style={{
        color: "white",
        padding: 20,
      }}
    >
      <h2>Lucky Box Test</h2>

      <p>Total Rewards: {rewards.length}</p>

      <button
        onClick={spin}
        disabled={spinning}
      >
        {spinning ? "Spinning..." : "Spin Lucky Box"}
      </button>

      {selectedReward && (
        <div
          style={{
            marginTop: 20,
            border: "1px solid gray",
            padding: 20,
            borderRadius: 10,
          }}
        >
          <h3>Reward</h3>

          <p>
            Type:
            {" "}
            {selectedReward.reward_type}
          </p>

          <p>
            Value:
            {" "}
            {selectedReward.reward_value}
          </p>

          <p>
            Probability:
            {" "}
            {selectedReward.probability}
            %
          </p>
        </div>
      )}
    </div>
  );
}