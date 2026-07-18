import {
  requireTelegramSession,
  TelegramAuthError,
} from "../_shared/telegram-auth/index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Scope = "daily" | "weekly";

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function tables(scope: Scope) {
  if (scope === "weekly") {
    return {
      userTable: "users_weekly_challenges",
      challengeTable: "weekly_challenge",
    };
  }

  return {
    userTable: "users_daily_challenges",
    challengeTable: "daily_challenges",
  };
}

async function updateLeaderboard(params: {
  userId: number;
  rewardPoints: number;
}) {
  const supabase = supabaseAdmin();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("telegram_id, username, photo_url, level, vip, points")
    .eq("id", params.userId)
    .single();

  if (userError) throw userError;

  const { data: existing, error: findError } = await supabase
    .from("leaderboard")
    .select("id, total_points")
    .eq("telegram_id", user.telegram_id)
    .maybeSingle();

  if (findError) throw findError;

  if (existing?.id) {
    const { error } = await supabase
      .from("leaderboard")
      .update({
        total_points: (existing.total_points ?? 0) + params.rewardPoints,
        username: user.username,
        photo_url: user.photo_url,
        level: user.level,
        vip: user.vip,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("leaderboard").insert({
    telegram_id: user.telegram_id,
    username: user.username,
    photo_url: user.photo_url,
    level: user.level,
    total_points: user.points ?? 0,
    rank: 0,
    vip: user.vip,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const session = await requireTelegramSession(req);
    const userId = session.userId;

    const body = await req.json();
    const challengeId = Number(body.challenge_id);
    const scope = String(body.challenge_scope ?? "daily") as Scope;

    if (!challengeId) throw new Error("Missing challenge_id");
    if (scope !== "daily" && scope !== "weekly") {
      throw new Error("challenge_scope must be daily or weekly");
    }

    const supabase = supabaseAdmin();
    const t = tables(scope);

    const { data: userChallenge, error: ucError } = await supabase
      .from(t.userTable)
      .select("*")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .single();

    if (ucError) throw ucError;

    if (!userChallenge.completed) {
      throw new Error("Challenge is not completed yet");
    }

    if (userChallenge.reward_claimed) {
      throw new Error("Reward already claimed");
    }

    const { data: challenge, error: chError } = await supabase
      .from(t.challengeTable)
      .select("id, reward_points, active")
      .eq("id", challengeId)
      .single();

    if (chError) throw chError;

    if (!challenge.active) {
      throw new Error("Challenge is not active");
    }

    const rewardPoints = Number(challenge.reward_points ?? 0);

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("points")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        points: Number(user.points ?? 0) + rewardPoints,
      })
      .eq("id", userId);

    if (updateUserError) throw updateUserError;

    await updateLeaderboard({
      userId,
      rewardPoints,
    });

    const { error: claimError } = await supabase
      .from(t.userTable)
      .update({
        reward_claimed: true,
      })
      .eq("id", userChallenge.id);

    if (claimError) throw claimError;

    return Response.json(
      {
        success: true,
        user_id: userId,
        challenge_scope: scope,
        challenge_id: challengeId,
        reward_points: rewardPoints,
      },
      { headers: corsHeaders },
    );
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: error?.message ?? String(error),
        code: error?.code ?? null,
        details: error?.details ?? null,
        hint: error?.hint ?? null,
      },
      {
        status: error instanceof TelegramAuthError ? error.status : 500,
        headers: corsHeaders,
      },
    );
  }
});
