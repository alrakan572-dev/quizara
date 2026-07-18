import { requireTelegramSession } from "../_shared/telegram-auth/index.ts";
import {
  GameEngineError,
  gameClient,
  toGameEngineError,
} from "../_shared/game-engine/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type ChallengeScope = "daily" | "weekly";

type ChallengeRow = {
  id: number;
  title: string | null;
  description?: string | null;
  reward_points: number | null;
  challenge_type: string | null;
  required_count: number | null;
  active: boolean | null;
  language: string | null;
};

type UserChallengeRow = {
  id: number;
  challenge_id: number;
  progress: number | null;
  score: number | null;
  completed: boolean | null;
  reward_claimed: boolean | null;
  completed_at: string | null;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function statusFromCode(code: string): number {
  if (
    code === "SESSION_TOKEN_MISSING" ||
    code === "SESSION_INVALID_OR_EXPIRED" ||
    code === "SESSION_USER_NOT_FOUND"
  )
    return 401;
  if (code === "USER_BLOCKED") return 403;
  if (
    code === "INVALID_JSON_BODY" ||
    code === "INVALID_USER_ID" ||
    code === "INVALID_LANGUAGE"
  ) {
    return 400;
  }

  if (code === "USER_NOT_FOUND" || code === "PGRST116") {
    return 404;
  }

  return 500;
}

function validateLanguage(value: unknown): "ar" | "en" {
  const language = String(value ?? "en")
    .trim()
    .toLowerCase();

  if (language !== "ar" && language !== "en") {
    throw new GameEngineError("language must be ar or en", "INVALID_LANGUAGE");
  }

  return language;
}

function calculateProgressPercent(
  progress: number,
  requiredCount: number,
): number {
  if (requiredCount <= 0) {
    return 0;
  }

  return Math.min(
    Math.max(Math.floor((progress / requiredCount) * 100), 0),
    100,
  );
}

async function getChallenges(params: {
  scope: ChallengeScope;
  userId: number;
  language: "ar" | "en";
}) {
  const client = gameClient();

  const challengeTable =
    params.scope === "daily" ? "daily_challenges" : "weekly_challenge";

  const progressTable =
    params.scope === "daily"
      ? "users_daily_challenges"
      : "users_weekly_challenges";

  const { data: challenges, error: challengesError } = await client
    .from(challengeTable)
    .select(
      "id,title,description,reward_points,challenge_type,required_count,active,language",
    )
    .eq("active", true)
    .eq("language", params.language)
    .order("id", { ascending: true });

  if (challengesError) {
    throw challengesError;
  }

  const challengeRows = (challenges ?? []) as ChallengeRow[];

  if (challengeRows.length === 0) {
    return [];
  }

  const challengeIds = challengeRows.map((challenge) => challenge.id);

  const { data: progressRows, error: progressError } = await client
    .from(progressTable)
    .select(
      "id,challenge_id,progress,score,completed,reward_claimed,completed_at",
    )
    .eq("user_id", params.userId)
    .in("challenge_id", challengeIds);

  if (progressError) {
    throw progressError;
  }

  const progressByChallengeId = new Map<number, UserChallengeRow>();

  for (const row of (progressRows ?? []) as UserChallengeRow[]) {
    progressByChallengeId.set(Number(row.challenge_id), row);
  }

  return challengeRows.map((challenge) => {
    const userProgress = progressByChallengeId.get(challenge.id);

    const requiredCount = Math.max(Number(challenge.required_count ?? 0), 0);

    const progress = Math.min(
      Math.max(Number(userProgress?.progress ?? 0), 0),
      requiredCount,
    );

    const completed =
      Boolean(userProgress?.completed) ||
      (requiredCount > 0 && progress >= requiredCount);

    const rewardClaimed = Boolean(userProgress?.reward_claimed);

    return {
      id: challenge.id,
      scope: params.scope,
      title: challenge.title,
      description: challenge.description ?? null,
      challenge_type: challenge.challenge_type,
      language: challenge.language,
      required_count: requiredCount,
      reward_points: Number(challenge.reward_points ?? 0),

      progress,
      score: Number(userProgress?.score ?? 0),
      progress_percent: calculateProgressPercent(progress, requiredCount),

      completed,
      completed_at: userProgress?.completed_at ?? null,
      reward_claimed: rewardClaimed,
      can_claim: completed && !rewardClaimed,

      user_challenge_id: userProgress?.id ?? null,
    };
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Only POST requests are allowed",
        },
      },
      405,
    );
  }

  try {
    const session = await requireTelegramSession(req);
    const userId = session.userId;

    const rawBody = await req.json().catch(() => {
      throw new GameEngineError(
        "Request body must be valid JSON",
        "INVALID_JSON_BODY",
      );
    });
    const language = validateLanguage(rawBody?.language);

    const client = gameClient();

    const { data: user, error: userError } = await client
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new GameEngineError("User was not found", "USER_NOT_FOUND");
    }

    const [daily, weekly] = await Promise.all([
      getChallenges({
        scope: "daily",
        userId,
        language,
      }),
      getChallenges({
        scope: "weekly",
        userId,
        language,
      }),
    ]);

    console.log(
      "GET_ACTIVE_CHALLENGES_SUCCESS",
      JSON.stringify({
        user_id: userId,
        language,
        daily_count: daily.length,
        weekly_count: weekly.length,
        timestamp: new Date().toISOString(),
      }),
    );

    return jsonResponse(
      {
        success: true,
        data: {
          user_id: userId,
          language,
          daily,
          weekly,
        },
      },
      200,
    );
  } catch (error: unknown) {
    const gameError = toGameEngineError(error);

    console.error(
      "GET_ACTIVE_CHALLENGES_EXCEPTION",
      JSON.stringify({
        code: gameError.code,
        message: gameError.message,
        details: gameError.details ?? null,
        hint: gameError.hint ?? null,
        stack: error instanceof Error ? error.stack : null,
        timestamp: new Date().toISOString(),
      }),
    );

    return jsonResponse(
      {
        success: false,
        error: {
          code: gameError.code,
          message: gameError.message,
          details: gameError.details ?? null,
          hint: gameError.hint ?? null,
        },
      },
      statusFromCode(gameError.code),
    );
  }
});
