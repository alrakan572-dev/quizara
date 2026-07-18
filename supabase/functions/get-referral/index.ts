import {
  requireTelegramSession,
} from "../_shared/telegram-auth/index.ts";
import {
  GameEngineError,
  gameClient,
  toGameEngineError,
} from "../_shared/game-engine/index.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

function statusFromCode(code: string): number {
  if (
    code === "SESSION_TOKEN_MISSING" ||
    code === "SESSION_INVALID_OR_EXPIRED" ||
    code === "SESSION_USER_NOT_FOUND"
  ) return 401;

  if (code === "USER_BLOCKED") return 403;

  if (
    code === "INVALID_JSON_BODY" ||
    code === "INVALID_REFERRAL_CODE" ||
    code === "INVALID_INVITER_REWARD" ||
    code === "INVALID_INVITED_REWARD"
  ) return 400;

  if (
    code === "USER_NOT_FOUND" ||
    code === "INVITER_NOT_FOUND" ||
    code === "REFERRAL_CODE_NOT_FOUND"
  ) return 404;

  if (
    code === "SELF_REFERRAL_NOT_ALLOWED" ||
    code === "REFERRAL_ALREADY_CLAIMED" ||
    code === "23505"
  ) return 409;

  return 500;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  if (req.method !== "POST") {
    return response({
      success: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Only POST requests are allowed",
      },
    }, 405);
  }

  try {
    const session = await requireTelegramSession(req);
    await req.json().catch(() => ({}));

    const db = gameClient();

    const { data: referral, error: referralError } = await db
      .from("referrals")
      .select("id,referral_code,active,created_at")
      .eq("inviter_user_id", session.userId)
      .maybeSingle();

    if (referralError) throw referralError;

    let currentReferral = referral;

    if (!currentReferral) {
      const { data, error } = await db.rpc(
        "ensure_referral_link",
        {
          p_user_id: session.userId,
        },
      );

      if (error) throw error;

      currentReferral = {
        id: Number(data.id),
        referral_code: String(data.referral_code),
        active: Boolean(data.active),
        created_at: data.created_at,
      };
    }

    const { data: claims, error: claimsError } = await db
      .from("referral_claims")
      .select(
        "id,invited_user_id,invited_telegram_id,inviter_reward_points,invited_reward_points,claimed_at",
      )
      .eq("inviter_user_id", session.userId)
      .order("claimed_at", { ascending: false });

    if (claimsError) throw claimsError;

    const invitedIds = (claims ?? []).map((row) =>
      Number(row.invited_user_id)
    );

    let invitedUsers: Array<{
      id: number;
      username: string | null;
      first_name: string | null;
      photo_url: string | null;
      created_at: string | null;
    }> = [];

    if (invitedIds.length > 0) {
      const { data: users, error: usersError } = await db
        .from("users")
        .select("id,username,first_name,photo_url,created_at")
        .in("id", invitedIds);

      if (usersError) throw usersError;
      invitedUsers = users ?? [];
    }

    const userMap = new Map(
      invitedUsers.map((user) => [Number(user.id), user]),
    );

    const totalEarned = (claims ?? []).reduce(
      (sum, row) => sum + Number(row.inviter_reward_points ?? 0),
      0,
    );

    const friends = (claims ?? []).map((claim) => {
      const user = userMap.get(Number(claim.invited_user_id));

      return {
        claim_id: Number(claim.id),
        user_id: Number(claim.invited_user_id),
        telegram_id: Number(claim.invited_telegram_id),
        username: user?.username ?? null,
        first_name: user?.first_name ?? null,
        photo_url: user?.photo_url ?? null,
        joined_at: claim.claimed_at,
        inviter_reward_points:
          Number(claim.inviter_reward_points ?? 0),
      };
    });

    const code = String(currentReferral.referral_code);

    return response({
      success: true,
      data: {
        referral: {
          id: Number(currentReferral.id),
          referral_code: code,
          referral_url:
            `https://t.me/quizor345bot?startapp=${encodeURIComponent(code)}`,
          active: Boolean(currentReferral.active),
          created_at: currentReferral.created_at,
        },
        stats: {
          invited_count: friends.length,
          registered_count: friends.length,
          total_points_earned: totalEarned,
        },
        friends,
      },
    });
  } catch (unknownError) {
    const error = toGameEngineError(unknownError);

    return response({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
        hint: error.hint ?? null,
      },
    }, statusFromCode(error.code));
  }
});
