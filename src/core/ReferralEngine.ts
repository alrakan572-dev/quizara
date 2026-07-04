import { ReferralService } from "../services/ReferralService";
import { emitGameEvent } from "./EventEngine";

export async function registerReferral(
  inviterId: number,
  invitedId: number
) {
  const result = await ReferralService.registerInvite(
    inviterId,
    invitedId
  );

  await emitGameEvent({
    type: "referral_registered",
    telegramId: inviterId,
  });

  return result;
}

export async function completeReferral(
  invitedId: number
) {
  const result =
    await ReferralService.claimInviteReward(
      invitedId
    );

  await emitGameEvent({
    type: "referral_reward_claimed",
    telegramId: invitedId,
  });

  return result;
}

export async function getReferralHistory(
  inviterId: number
) {
  return await ReferralService.getUserInvites(
    inviterId
  );
}