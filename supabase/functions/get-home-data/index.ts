import {
  requireTelegramSession,
} from "../_shared/telegram-auth/index.ts";
import {
  gameClient,
  toGameEngineError,
} from "../_shared/game-engine/index.ts";

type AppLanguage = "ar" | "en";

type UnknownRecord = Record<string, unknown>;

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
  ) {
    return 401;
  }

  if (code === "USER_BLOCKED") {
    return 403;
  }

  if (code === "USER_NOT_FOUND") {
    return 404;
  }

  if (
    code === "INVALID_LANGUAGE" ||
    code === "INVALID_REQUEST_BODY"
  ) {
    return 400;
  }

  if (code === "HOME_CONFIGURATION_ERROR") {
    return 500;
  }

  return 500;
}

function asRecord(value: unknown): UnknownRecord | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as UnknownRecord;
  }

  return null;
}

function firstRelation(value: unknown): UnknownRecord | null {
  if (Array.isArray(value)) {
    return asRecord(value[0]);
  }

  return asRecord(value);
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function parseLanguage(value: unknown): AppLanguage {
  return value === "ar" ? "ar" : "en";
}

function parseRequestLanguage(value: unknown): AppLanguage {
  if (value === undefined || value === null || value === "") {
    return "en";
  }

  if (value === "ar" || value === "en") {
    return value;
  }

  throw {
    code: "INVALID_LANGUAGE",
    message: "language must be either ar or en",
  };
}

function parsePositiveInteger(
  value: unknown,
  name: string,
): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw {
      code: "HOME_CONFIGURATION_ERROR",
      message: `${name} must be configured as a positive integer`,
    };
  }

  return parsed;
}

function parseNonNegativeNumber(
  value: unknown,
  name: string,
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw {
      code: "HOME_CONFIGURATION_ERROR",
      message: `${name} must be configured as a non-negative number`,
    };
  }

  return parsed;
}

function getSetting(
  settings: Record<string, string | null>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = settings[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0,
    0,
    0,
    0,
  ));
}

function progressPercent(
  progress: number,
  requiredCount: number,
): number {
  if (requiredCount <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, Math.round((progress / requiredCount) * 100)),
  );
}

function remainingTime(
  expireDate: string | null,
  nowMs: number,
): { seconds: number; days: number } {
  if (!expireDate) {
    return { seconds: 0, days: 0 };
  }

  const expireMs = new Date(expireDate).getTime();

  if (!Number.isFinite(expireMs) || expireMs <= nowMs) {
    return { seconds: 0, days: 0 };
  }

  const seconds = Math.floor((expireMs - nowMs) / 1000);

  return {
    seconds,
    days: Math.ceil(seconds / 86400),
  };
}

function mapChallenge(
  rowValue: unknown,
  relationName: string,
  scope: "daily" | "weekly",
  fallbackLanguage: AppLanguage,
) {
  const row = asRecord(rowValue);

  if (!row) {
    return null;
  }

  const challenge = firstRelation(row[relationName]);

  if (!challenge) {
    return null;
  }

  const progress = asNumber(row.progress);
  const score = asNumber(row.score);
  const requiredCount = asNumber(challenge.required_count);
  const completed = asBoolean(row.completed);
  const rewardClaimed = asBoolean(row.reward_claimed);

  return {
    id: asNumber(challenge.id),
    scope,
    title: asNullableString(challenge.title),
    description: asNullableString(challenge.description),
    challenge_type: asNullableString(challenge.challenge_type),
    language: parseLanguage(
      challenge.language ?? fallbackLanguage,
    ),
    required_count: requiredCount,
    reward_points: asNumber(challenge.reward_points),
    progress,
    score,
    progress_percent: progressPercent(
      progress,
      requiredCount,
    ),
    completed,
    completed_at: asNullableString(row.completed_at),
    reward_claimed: rewardClaimed,
    can_claim: completed && !rewardClaimed,
    user_challenge_id: asNullableNumber(row.id),
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  if (req.method !== "POST") {
    return response(
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

    const body = await req.json().catch(() => ({}));

    if (!asRecord(body)) {
      throw {
        code: "INVALID_REQUEST_BODY",
        message: "Request body must be a JSON object",
      };
    }

    const language = parseRequestLanguage(
      (body as UnknownRecord).language,
    );

    const db = gameClient();
    const nowDate = new Date();
    const now = nowDate.toISOString();
    const nowMs = nowDate.getTime();
    const todayStart = startOfUtcDay(nowDate).toISOString();

    const [
      userResult,
      vipResult,
      dailyResult,
      weeklyResult,
      leaderboardTopResult,
      leaderboardCurrentResult,
      settingsResult,
      luckyHistoryResult,
      verifiedAttemptResult,
      pendingAttemptResult,
    ] = await Promise.all([
      db
        .from("users")
        .select(
          [
            "id",
            "telegram_id",
            "username",
            "first_name",
            "photo_url",
            "points",
            "coins",
            "hints",
            "extra_spins",
            "level",
            "games_played",
            "total_correct",
            "total_wrong",
            "lives",
            "streak",
            "vip",
            "last_login",
            "created_at",
          ].join(","),
        )
        .eq("id", session.userId)
        .eq("telegram_id", session.telegramId)
        .single(),

      db
        .from("vip_subscriptions")
        .select(
          [
            "id",
            "plan_id",
            "source",
            "start_date",
            "expire_date",
            "active",
            "vip_plans!vip_subscriptions_plan_id_fkey(id,plan_name,duration_days,price,unlimited_games,ads_enabled,lucky_boxes_per_day,bonus_points_percent,vip_badge,active)",
          ].join(","),
        )
        .eq("telegram_id", session.telegramId)
        .eq("active", true)
        .gt("expire_date", now)
        .order("expire_date", { ascending: false })
        .limit(1)
        .maybeSingle(),

      db
        .from("users_daily_challenges")
        .select(
          [
            "id",
            "progress",
            "score",
            "completed",
            "completed_at",
            "reward_claimed",
            "daily_challenges!users_daily_challenges_challenge_id_fkey!inner(id,title,description,reward_points,challenge_type,required_count,active,language)",
          ].join(","),
        )
        .eq("user_id", session.userId)
        .eq("daily_challenges.active", true)
        .eq("daily_challenges.language", language)
        .order("created_at", { ascending: false }),

      db
        .from("user_weekly_challenges")
        .select(
          [
            "id",
            "progress",
            "score",
            "completed",
            "completed_at",
            "reward_claimed",
            "weekly_challenge!users_weekly_challenges_challenge_id_fkey!inner(id,title,description,reward_points,challenge_type,required_count,active,language)",
          ].join(","),
        )
        .eq("user_id", session.userId)
        .eq("weekly_challenge.active", true)
        .eq("weekly_challenge.language", language)
        .order("created_at", { ascending: false }),

      db
        .from("leaderboard")
        .select(
          "rank,telegram_id,username,total_points,level,vip,photo_url",
        )
        .order("rank", { ascending: true })
        .order("total_points", { ascending: false })
        .limit(20),

      db
        .from("leaderboard")
        .select(
          "rank,telegram_id,username,total_points,level,vip,photo_url",
        )
        .eq("telegram_id", session.telegramId)
        .maybeSingle(),

      db
        .from("settings")
        .select("key,value"),

      db
        .from("users_luckybox_history")
        .select("id,opened_at")
        .eq("user_id", session.userId)
        .gte("opened_at", todayStart)
        .order("opened_at", { ascending: false }),

      db
        .from("monetag_ad_attempts")
        .select("id,expires_at,status,consumed_at")
        .eq("user_id", session.userId)
        .eq("telegram_id", session.telegramId)
        .eq("status", "valued")
        .is("consumed_at", null)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      db
        .from("monetag_ad_attempts")
        .select("id,expires_at,status,consumed_at")
        .eq("user_id", session.userId)
        .eq("telegram_id", session.telegramId)
        .eq("status", "pending")
        .is("consumed_at", null)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const results = [
      userResult,
      vipResult,
      dailyResult,
      weeklyResult,
      leaderboardTopResult,
      leaderboardCurrentResult,
      settingsResult,
      luckyHistoryResult,
      verifiedAttemptResult,
      pendingAttemptResult,
    ];

    for (const result of results) {
      if (result.error) {
        throw result.error;
      }
    }

    const user = userResult.data;

    if (!user) {
      throw {
        code: "USER_NOT_FOUND",
        message: "The authenticated user was not found",
      };
    }

    const settings = Object.fromEntries(
      (settingsResult.data ?? []).map((row) => [
        String(row.key),
        row.value === null ? null : String(row.value),
      ]),
    ) as Record<string, string | null>;

    const subscription = asRecord(vipResult.data);
    const plan = firstRelation(subscription?.vip_plans);
    const vipActive = Boolean(subscription && plan);

    const subscriptionExpiry = asNullableString(
      subscription?.expire_date,
    );
    const remaining = remainingTime(
      subscriptionExpiry,
      nowMs,
    );

    const vipPlan = plan
      ? {
        id: asNumber(plan.id),
        name: asNullableString(plan.plan_name) ?? "",
        duration_days: asNumber(plan.duration_days),
        price: asNumber(plan.price),
        unlimited_games: asBoolean(plan.unlimited_games),
        ads_enabled: asBoolean(plan.ads_enabled),
        lucky_boxes_per_day: asNumber(
          plan.lucky_boxes_per_day,
        ),
        bonus_points_percent: asNumber(
          plan.bonus_points_percent,
        ),
        vip_badge: asBoolean(plan.vip_badge),
      }
      : null;

    const vipStatus = {
      vip: vipActive,
      subscription: subscription
        ? {
          id: asNumber(subscription.id),
          plan_id: asNullableNumber(subscription.plan_id),
          source: asNullableString(subscription.source),
          start_date: asNullableString(
            subscription.start_date,
          ),
          expire_date: subscriptionExpiry,
          active: asBoolean(subscription.active),
          remaining_seconds: remaining.seconds,
          remaining_days: remaining.days,
        }
        : null,
      plan: vipPlan,
      benefits: vipPlan
        ? {
          unlimited_games: vipPlan.unlimited_games,
          ads_enabled: vipPlan.ads_enabled,
          lucky_boxes_per_day:
            vipPlan.lucky_boxes_per_day,
          bonus_points_percent:
            vipPlan.bonus_points_percent,
          vip_badge: vipPlan.vip_badge,
        }
        : undefined,
    };

    const dailyChallenges = (dailyResult.data ?? [])
      .map((row) =>
        mapChallenge(
          row,
          "daily_challenges",
          "daily",
          language,
        )
      )
      .filter((item) => item !== null);

    const weeklyChallenges = (weeklyResult.data ?? [])
      .map((row) =>
        mapChallenge(
          row,
          "weekly_challenge",
          "weekly",
          language,
        )
      )
      .filter((item) => item !== null);

    const topLeaderboard = (leaderboardTopResult.data ?? [])
      .map((row) => ({
        rank: asNumber(row.rank),
        telegram_id: asNumber(row.telegram_id),
        username: asNullableString(row.username),
        total_points: asNumber(row.total_points),
        level: asNumber(row.level, 1),
        vip: asBoolean(row.vip),
        photo_url: asNullableString(row.photo_url),
      }));

    const currentLeaderboard = leaderboardCurrentResult.data
      ? {
        rank: asNumber(leaderboardCurrentResult.data.rank),
        telegram_id: asNumber(
          leaderboardCurrentResult.data.telegram_id,
        ),
        username: asNullableString(
          leaderboardCurrentResult.data.username,
        ),
        total_points: asNumber(
          leaderboardCurrentResult.data.total_points,
        ),
        level: asNumber(
          leaderboardCurrentResult.data.level,
          1,
        ),
        vip: asBoolean(
          leaderboardCurrentResult.data.vip,
        ),
        photo_url: asNullableString(
          leaderboardCurrentResult.data.photo_url,
        ),
      }
      : null;

    const envZoneId = Deno.env.get("MONETAG_ZONE_ID");
    const settingZoneId = getSetting(settings, [
      "monetag_zone_id",
      "lucky_box_zone_id",
    ]);
    const zoneId = parsePositiveInteger(
      envZoneId ?? settingZoneId,
      "MONETAG_ZONE_ID or monetag_zone_id",
    );

    const defaultDailyLimit = getSetting(settings, [
      "lucky_box_daily_limit",
      "lucky_boxes_per_day",
    ]);

    const planDailyLimit = vipPlan?.lucky_boxes_per_day ?? 0;
    const dailyLimit = planDailyLimit > 0
      ? planDailyLimit
      : parsePositiveInteger(
        defaultDailyLimit,
        "lucky_box_daily_limit",
      );

    const cooldownHours = parseNonNegativeNumber(
      getSetting(settings, [
        "lucky_box_cooldown_hours",
        "luckybox_cooldown_hours",
      ]),
      "lucky_box_cooldown_hours",
    );

    const history = luckyHistoryResult.data ?? [];
    const openedToday = history.length;
    const latestHistory = history[0] ?? null;
    const lastOpenedAt = asNullableString(
      latestHistory?.opened_at,
    );

    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    const lastOpenedMs = lastOpenedAt
      ? new Date(lastOpenedAt).getTime()
      : Number.NaN;

    const nextOpenMs = Number.isFinite(lastOpenedMs)
      ? lastOpenedMs + cooldownMs
      : Number.NaN;

    const cooldownActive = Number.isFinite(nextOpenMs) &&
      nextOpenMs > nowMs;

    const remainingSeconds = cooldownActive
      ? Math.max(0, Math.ceil((nextOpenMs - nowMs) / 1000))
      : 0;

    const remainingToday = Math.max(
      0,
      dailyLimit - openedToday,
    );

    const verifiedAttemptId = verifiedAttemptResult.data
      ? String(verifiedAttemptResult.data.id)
      : null;

    const pendingAttemptId = pendingAttemptResult.data
      ? String(pendingAttemptResult.data.id)
      : null;

    const canWatchAd =
      remainingToday > 0 &&
      !cooldownActive &&
      verifiedAttemptId === null &&
      pendingAttemptId === null;

    const canOpen =
      remainingToday > 0 &&
      !cooldownActive &&
      verifiedAttemptId !== null;

    return response({
      success: true,
      data: {
        user: {
          id: asNumber(user.id),
          telegram_id: asNumber(user.telegram_id),
          username: asNullableString(user.username),
          first_name: asNullableString(user.first_name),
          photo_url: asNullableString(user.photo_url),
          points: asNumber(user.points),
          coins: asNumber(user.coins),
          hints: asNumber(user.hints),
          extra_spins: asNumber(user.extra_spins),
          level: asNumber(user.level, 1),
          games_played: asNumber(user.games_played),
          total_correct: asNumber(user.total_correct),
          total_wrong: asNumber(user.total_wrong),
          lives: asNumber(user.lives, 3),
          streak: asNumber(user.streak),
          vip: vipActive,
          last_login: asNullableString(user.last_login),
          created_at: asNullableString(user.created_at),
        },

        vip: vipStatus,

        challenges: {
          daily: dailyChallenges,
          weekly: weeklyChallenges,
        },

        leaderboard: {
          top: topLeaderboard,
          current_user: currentLeaderboard,
        },

        lucky_box: {
          provider: "monetag",
          zone_id: zoneId,
          ad_required: true,
          daily_limit: dailyLimit,
          opened_today: openedToday,
          remaining_today: remainingToday,
          cooldown_hours: cooldownHours,
          cooldown_active: cooldownActive,
          remaining_seconds: remainingSeconds,
          last_opened_at: lastOpenedAt,
          next_open_at: cooldownActive
            ? new Date(nextOpenMs).toISOString()
            : null,
          can_watch_ad: canWatchAd,
          can_open: canOpen,
          verified_attempt_id: verifiedAttemptId,
          pending_attempt_id: pendingAttemptId,
        },

        settings,

        meta: {
          language,
          generated_at: now,
        },
      },
    });
  } catch (unknownError) {
    const error = toGameEngineError(unknownError);

    return response(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
          hint: error.hint ?? null,
        },
      },
      statusFromCode(error.code),
    );
  }
});
