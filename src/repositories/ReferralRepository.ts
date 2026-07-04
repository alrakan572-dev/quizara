import { supabase } from "../lib/supabase";

export const ReferralRepository = {
  async createInvite(data: {
    inviter_id: number;
    invited_id: number;
    reward_points: number;
    reward_given: boolean;
  }) {
    return await supabase
      .from("invites")
      .insert(data)
      .select()
      .single();
  },

  async getInvite(invitedId: number) {
    return await supabase
      .from("invites")
      .select("*")
      .eq("invited_id", invitedId)
      .maybeSingle();
  },

  async getInvitesByUser(inviterId: number) {
    return await supabase
      .from("invites")
      .select("*")
      .eq("inviter_id", inviterId)
      .order("created_at", { ascending: false });
  },

  async markRewardGiven(inviteId: number) {
    return await supabase
      .from("invites")
      .update({
        reward_given: true,
      })
      .eq("id", inviteId);
  }

};