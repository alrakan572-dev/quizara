import { useWeeklyChallenge } from "../hooks/useWeeklyChallenge";

export function WeeklyChallengeTestPage() {
  const {
    challenge,
    userChallenge,
    loading,
    addProgress,
    claimReward,
  } = useWeeklyChallenge(123456789, "en");

  if (loading) {
    return <div style={{ color: "white", padding: 20 }}>Loading...</div>;
  }

  if (!challenge) {
    return <div style={{ color: "white", padding: 20 }}>No active weekly challenge found.</div>;
  }

  return (
    <div style={{ color: "white", padding: 20 }}>
      <h2>Weekly Challenge Test</h2>

      <p>Title: {challenge.title}</p>
      <p>Description: {challenge.description}</p>
      <p>
        Progress: {userChallenge?.progress ?? 0} / {challenge.required_count}
      </p>
      <p>Completed: {userChallenge?.completed ? "Yes" : "No"}</p>
      <p>Reward Claimed: {userChallenge?.reward_claimed ? "Yes" : "No"}</p>
      <p>Reward: {challenge.reward_points} points</p>

      <button onClick={() => addProgress(1)}>
        Add Progress +1
      </button>

      <br /><br />

      <button onClick={() => claimReward()}>
        Claim Reward
      </button>
    </div>
  );
}