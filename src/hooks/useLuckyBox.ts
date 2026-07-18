import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { loadLuckyBoxRewards, saveLuckyBoxHistory } from "../services/LuckyBoxService";
import {
  spinLuckyBox,
  convertLuckyBoxRewardToWalletReward,
  type LuckyBoxReward,
} from "../core/LuckyBoxEngine";
import { giveReward } from "../services/RewardService";
import { emitGameEvent } from "../core/EventEngine";

export function useLuckyBox() {
  const { user } = useAuth();
  const telegramId = user?.telegram_id ?? null;
  const [rewards, setRewards] = useState<LuckyBoxReward[]>([]);
  const [selectedReward, setSelectedReward] = useState<LuckyBoxReward | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const data = await loadLuckyBoxRewards();
      if (active) {
        setRewards(data);
        setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  async function spin() {
    if (!telegramId || spinning || loading || rewards.length === 0) {
      return null;
    }

    setSpinning(true);

    try {
      const reward = spinLuckyBox(rewards);
      if (!reward) return null;

      setSelectedReward(reward);
      const walletReward = convertLuckyBoxRewardToWalletReward(reward);

      await giveReward(telegramId, walletReward);
      await saveLuckyBoxHistory(telegramId, reward);
      await emitGameEvent({
        type: "lucky_box_spin",
        telegramId,
      });

      return reward;
    } finally {
      setSpinning(false);
    }
  }

  return {
    rewards,
    selectedReward,
    loading,
    spinning,
    spin,
  };
}
