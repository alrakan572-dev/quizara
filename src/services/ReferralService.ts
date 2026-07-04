import { ReferralRepository } from "../repositories/ReferralRepository";
import { giveReward } from "./RewardService";
import { getSetting } from "./SettingsService";

async function getInviterRewardPoints() {
  const value = await getSetting("referral_reward_inviter");
  return Number(value ?? 100);
}

async function getInvitedRewardPoints() {
  const value = await getSetting("referral_reward_invited");
  return Number(value ?? 50);
}

export class ReferralService {
  static async registerInvite(
    inviterId: number,
    invitedId: number
  ) {
    if (inviterId === invitedId) {
      throw new Error("User cannot invite himself.");
    }

    const existingInvite =
      await ReferralRepository.getInvite(invitedId);

    if (existingInvite.data) {
      throw new Error("User already invited.");
    }

    const inviterReward =
      await getInviterRewardPoints();

    return await ReferralRepository.createInvite({
      inviter_id: inviterId,
      invited_id: invitedId,
      reward_points: inviterReward,
      reward_given: false,
    });
  }

  static async claimInviteReward(invitedId: number) {
    const { data: invite, error } =
      await ReferralRepository.getInvite(invitedId);

    if (error || !invite) {
      throw new Error("Invite not found.");
    }

    if (invite.reward_given) {
      throw new Error("Reward already claimed.");
    }

    const invitedReward =
      await getInvitedRewardPoints();

    await giveReward(invite.inviter_id, {
      type: "points",
      value: invite.reward_points,
    });

    await giveReward(invitedId, {
      type: "points",
      value: invitedReward,
    });

    await ReferralRepository.markRewardGiven(
      invite.id
    );

    return true;
  }

  static async getUserInvites(inviterId: number) {
    return await ReferralRepository.getInvitesByUser(
      inviterId
    );
  }
}