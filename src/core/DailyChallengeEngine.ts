export function calculateDailyProgress(
  currentProgress: number,
  amount: number,
  requiredCount: number
) {
  const newProgress = currentProgress + amount;

  return {
    progress: newProgress,
    completed: newProgress >= requiredCount,
  };
}

export function canClaimDailyReward(userChallenge: {
  completed: boolean;
  reward_claimed: boolean;
}) {
  return (
    userChallenge.completed === true &&
    userChallenge.reward_claimed === false
  );
}