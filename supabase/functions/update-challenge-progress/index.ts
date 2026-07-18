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

type EventType =
  | "answer_correct"
  | "finish_fastest"
  | "solve_riddle"
  | "complete_find_difference";

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function dailyEventToChallengeType(eventType: EventType) {
  if (eventType === "answer_correct") return "quiz";
  if (eventType === "finish_fastest") return "fastest";
  if (eventType === "solve_riddle") return "riddles";
  if (eventType === "complete_find_difference") return "find_difference";
  return null;
}

function weeklyEventToChallengeType(eventType: EventType) {
  if (eventType === "answer_correct") return "answer_correct";
  if (eventType === "finish_fastest") return "finish_fastest";
  if (eventType === "solve_riddle") return "solve_riddles";
  if (eventType === "complete_find_difference")
    return "complete_find_difference";
  return null;
}

async function updateProgress(params: {
  table: "users_daily_challenges" | "users_weekly_challenges";
  challengeTable: "daily_challenges" | "weekly_challenge";
  userId: number;
  challengeType: string;
  score: number;
}) {
  const supabase = supabaseAdmin();

  const { data: challenges, error: challengeError } = await supabase
    .from(params.challengeTable)
    .select("id, required_count, active")
    .eq("challenge_type", params.challengeType)
    .eq("active", true);

  if (challengeError) throw challengeError;

  let updated = 0;
  let completedNow = 0;

  for (const challenge of challenges ?? []) {
    const { data: existing, error: existingError } = await supabase
      .from(params.table)
      .select("*")
      .eq("user_id", params.userId)
      .eq("challenge_id", challenge.id)
      .maybeSingle();

    if (existingError) throw existingError;

    const oldProgress = existing?.progress ?? 0;
    const oldScore = existing?.score ?? 0;
    const newProgress = Math.min(oldProgress + 1, challenge.required_count);
    const isCompleted = newProgress >= challenge.required_count;
    const wasCompleted = existing?.completed === true;

    if (existing?.id) {
      const { error } = await supabase
        .from(params.table)
        .update({
          progress: newProgress,
          score: oldScore + params.score,
          completed: isCompleted,
          completed_at:
            isCompleted && !wasCompleted
              ? new Date().toISOString()
              : existing.completed_at,
        })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from(params.table).insert({
        user_id: params.userId,
        challenge_id: challenge.id,
        progress: newProgress,
        score: params.score,
        completed: isCompleted,
        reward_claimed: false,
        completed_at: isCompleted ? new Date().toISOString() : null,
      });

      if (error) throw error;
    }

    updated++;
    if (isCompleted && !wasCompleted) completedNow++;
  }

  return { updated, completedNow };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const session = await requireTelegramSession(req);
    const userId = session.userId;

    const body = await req.json();
    const eventType = body.event_type as EventType;
    const score = Number(body.score ?? 0);

    if (!eventType) {
      throw new Error("Missing event_type");
    }

    const dailyType = dailyEventToChallengeType(eventType);
    const weeklyType = weeklyEventToChallengeType(eventType);

    const daily = dailyType
      ? await updateProgress({
          table: "users_daily_challenges",
          challengeTable: "daily_challenges",
          userId,
          challengeType: dailyType,
          score,
        })
      : { updated: 0, completedNow: 0 };

    const weekly = weeklyType
      ? await updateProgress({
          table: "users_weekly_challenges",
          challengeTable: "weekly_challenge",
          userId,
          challengeType: weeklyType,
          score,
        })
      : { updated: 0, completedNow: 0 };

    return Response.json(
      {
        success: true,
        user_id: userId,
        event_type: eventType,
        daily,
        weekly,
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
