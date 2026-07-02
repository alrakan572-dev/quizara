import {
  calculateMissionProgress,
  canClaimMissionReward,
} from "./MissionEngine";

export function updateWeeklyMission(
  currentProgress: number,
  amount: number,
  required: number
) {
  return calculateMissionProgress(
    currentProgress,
    amount,
    required
  );
}

export function canClaimWeeklyReward(
  completed: boolean,
  rewardClaimed: boolean
) {
  return canClaimMissionReward({
    progress: 0,
    required: 0,
    completed,
    rewardClaimed,
  });
}