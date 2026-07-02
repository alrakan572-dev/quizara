import { useEffect, useState } from "react";
import { loadLuckyBoxRewards } from "../services/LuckyBoxService";
import {
  spinLuckyBox,
  convertLuckyBoxRewardToWalletReward,
  type LuckyBoxReward,
} from "../core/LuckyBoxEngine";
import { giveReward } from "../services/RewardService";
import { saveLuckyBoxHistory } from "../services/LuckyBoxService";
import { emitGameEvent } from "../core/EventEngine";
export function useLuckyBox(telegramId = 123456789) {
  const [rewards, setRewards] = useState<LuckyBoxReward[]>([]);
  const [selectedReward, setSelectedReward] =
    useState<LuckyBoxReward | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await loadLuckyBoxRewards();
      setRewards(data);
      setLoading(false);
    }

    load();
  }, []);

  async function spin() {
    if (spinning || loading || rewards.length === 0) return null;

    setSpinning(true);

    const reward = spinLuckyBox(rewards);

    if (reward) {
   setSelectedReward(reward);

   const walletReward =
    convertLuckyBoxRewardToWalletReward(reward);

   await giveReward(telegramId, walletReward);

   await saveLuckyBoxHistory(
    telegramId,
    reward
   );

   await emitGameEvent({
    type: "lucky_box_spin",
    telegramId,
  });
}
    return reward;
  }

  return {
    rewards,
    selectedReward,
    loading,
    spinning,
    spin,
  };
}