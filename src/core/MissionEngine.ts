export interface MissionProgress {
  progress: number;
  required: number;
  completed: boolean;
  rewardClaimed: boolean;
}

export function calculateMissionProgress(
  currentProgress: number,
  amount: number,
  required: number
): MissionProgress {
  const progress = currentProgress + amount;

  return {
    progress,
    required,
    completed: progress >= required,
    rewardClaimed: false,
  };
}

export function isMissionCompleted(
  progress: number,
  required: number
) {
  return progress >= required;
}

export function canClaimMissionReward(
  mission: MissionProgress
) {
  return (
    mission.completed &&
    !mission.rewardClaimed
  );
}

export function getMissionPercentage(
  progress: number,
  required: number
) {
  if (required <= 0) return 0;

  return Math.min(
    Math.round((progress / required) * 100),
    100
  );
}