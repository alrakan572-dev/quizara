import {
  requireTelegramSession,
} from "../_shared/telegram-auth/index.ts";
import {
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

function response(
  body: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers,
    },
  );
}

function statusFromCode(
  code: string,
): number {
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

  return 500;
}

Deno.serve(
  async (
    req: Request,
  ): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers,
      });
    }

    if (req.method !== "POST") {
      return response(
        {
          success: false,
          error: {
            code:
              "METHOD_NOT_ALLOWED",
            message:
              "Only POST requests are allowed",
          },
        },
        405,
      );
    }

    try {
      const session =
        await requireTelegramSession(
          req,
        );

      await req
        .json()
        .catch(() => ({}));

      const db = gameClient();
      const now =
        new Date().toISOString();

      const [
        userResult,
        vipResult,
        leaderboardResult,
        dailyResult,
        weeklyResult,
        luckyResult,
        settingsResult,
        playersCountResult,
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
              "language",
              "points",
              "level",
              "streak",
              "lives",
            ].join(","),
          )
          .eq(
            "id",
            session.userId,
          )
          .single(),

        db
          .from(
            "vip_subscriptions",
          )
          .select(
            "plan,status,expire_date",
          )
          .eq(
            "telegram_id",
            session.telegramId,
          )
          .eq(
            "status",
            "active",
          )
          .gt(
            "expire_date",
            now,
          )
          .order(
            "expire_date",
            {
              ascending: false,
            },
          )
          .limit(1)
          .maybeSingle(),

        db
          .from("leaderboard")
          .select(
            "rank,total_points",
          )
          .eq(
            "telegram_id",
            session.telegramId,
          )
          .maybeSingle(),

        db
          .from(
            "user_daily_challenges",
          )
          .select(
            [
              "id",
              "progress",
              "completed",
              "claimed",
              "daily_challenges(",
              "id,title,description,target,reward_points,expires_at",
              ")",
            ].join(""),
          )
          .eq(
            "telegram_id",
            session.telegramId,
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          ),

        db
          .from(
            "user_weekly_challenges",
          )
          .select(
            [
              "id",
              "progress",
              "completed",
              "claimed",
              "weekly_challenge(",
              "id,title,description,target,reward_points,expires_at",
              ")",
            ].join(""),
          )
          .eq(
            "telegram_id",
            session.telegramId,
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          ),

        db
          .from(
            "lucky_box_attempts",
          )
          .select(
            "id,status,available_at,opened_at",
          )
          .eq(
            "telegram_id",
            session.telegramId,
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          )
          .limit(1)
          .maybeSingle(),

        db
          .from("settings")
          .select("key,value")
          .in("key", [
            "app_version",
            "maintenance_mode",
            "telegram_bot_username",
            "support_username",
            "ads_every_questions",
          ]),

        db
          .from("users")
          .select(
            "id",
            {
              count: "exact",
              head: true,
            },
          ),
      ]);

      if (userResult.error) {
        throw userResult.error;
      }

      if (vipResult.error) {
        throw vipResult.error;
      }

      if (
        leaderboardResult.error
      ) {
        throw leaderboardResult.error;
      }

      if (dailyResult.error) {
        throw dailyResult.error;
      }

      if (weeklyResult.error) {
        throw weeklyResult.error;
      }

      if (luckyResult.error) {
        throw luckyResult.error;
      }

      if (settingsResult.error) {
        throw settingsResult.error;
      }

      if (
        playersCountResult.error
      ) {
        throw playersCountResult.error;
      }

      const settings =
        Object.fromEntries(
          (
            settingsResult.data ?? []
          ).map((row) => [
            String(row.key),
            row.value,
          ]),
        );

      const dailyChallenges =
        (
          dailyResult.data ?? []
        ).flatMap((row) => {
          const challenge =
            Array.isArray(
              row.daily_challenges,
            )
              ? row
                  .daily_challenges[0]
              : row.daily_challenges;

          if (!challenge) {
            return [];
          }

          return [
            {
              id: Number(
                challenge.id,
              ),
              title: String(
                challenge.title,
              ),
              description:
                challenge.description ??
                null,
              progress: Number(
                row.progress ?? 0,
              ),
              target: Number(
                challenge.target ??
                  0,
              ),
              completed: Boolean(
                row.completed,
              ),
              claimed: Boolean(
                row.claimed,
              ),
              reward_points:
                Number(
                  challenge.reward_points ??
                    0,
                ),
              expires_at:
                challenge.expires_at ??
                null,
            },
          ];
        });

      const weeklyChallenges =
        (
          weeklyResult.data ?? []
        ).flatMap((row) => {
          const challenge =
            Array.isArray(
              row.weekly_challenge,
            )
              ? row
                  .weekly_challenge[0]
              : row.weekly_challenge;

          if (!challenge) {
            return [];
          }

          return [
            {
              id: Number(
                challenge.id,
              ),
              title: String(
                challenge.title,
              ),
              description:
                challenge.description ??
                null,
              progress: Number(
                row.progress ?? 0,
              ),
              target: Number(
                challenge.target ??
                  0,
              ),
              completed: Boolean(
                row.completed,
              ),
              claimed: Boolean(
                row.claimed,
              ),
              reward_points:
                Number(
                  challenge.reward_points ??
                    0,
                ),
              expires_at:
                challenge.expires_at ??
                null,
            },
          ];
        });

      const lucky =
        luckyResult.data;

      const luckyAvailable =
        !lucky ||
        (
          lucky.available_at
            ? new Date(
                lucky.available_at,
              ).getTime() <=
              Date.now()
            : lucky.status !==
              "opened"
        );

      const user =
        userResult.data;

      return response({
        success: true,
        data: {
          user: {
            id: Number(user.id),
            telegram_id:
              Number(
                user.telegram_id,
              ),
            username:
              user.username ??
              null,
            first_name:
              user.first_name ??
              null,
            photo_url:
              user.photo_url ??
              null,
            language:
              user.language ??
              "en",
            points: Number(
              user.points ?? 0,
            ),
            level:
              user.level === null
                ? null
                : Number(
                    user.level,
                  ),
            streak:
              user.streak === null
                ? null
                : Number(
                    user.streak,
                  ),
            lives:
              user.lives === null
                ? null
                : Number(
                    user.lives,
                  ),
          },

          vip: {
            active: Boolean(
              vipResult.data,
            ),
            plan:
              vipResult.data
                ?.plan ?? null,
            expires_at:
              vipResult.data
                ?.expire_date ??
              null,
          },

          leaderboard: {
            rank:
              leaderboardResult
                .data?.rank ===
              null
                ? null
                : Number(
                    leaderboardResult
                      .data?.rank ??
                      0,
                  ),
            total_players:
              Number(
                playersCountResult.count ??
                  0,
              ),
            total_points:
              Number(
                leaderboardResult
                  .data
                  ?.total_points ??
                  user.points ??
                  0,
              ),
          },

          daily_challenges:
            dailyChallenges,

          weekly_challenges:
            weeklyChallenges,

          lucky_box: {
            available:
              luckyAvailable,
            requires_rewarded_ad:
              true,
            next_available_at:
              lucky?.available_at ??
              null,
          },

          settings: {
            app_version:
              settings.app_version ??
              null,
            maintenance_mode:
              String(
                settings.maintenance_mode ??
                  "false",
              ).toLowerCase() ===
              "true",
            telegram_bot_username:
              settings.telegram_bot_username ??
              null,
            support_username:
              settings.support_username ??
              null,
            ads_every_questions:
              settings.ads_every_questions ===
              undefined
                ? null
                : Number(
                    settings.ads_every_questions,
                  ),
          },

          meta: {
            generated_at: now,
          },
        },
      });
    } catch (unknownError) {
      const error =
        toGameEngineError(
          unknownError,
        );

      return response(
        {
          success: false,
          error: {
            code: error.code,
            message:
              error.message,
            details:
              error.details ??
              null,
            hint:
              error.hint ??
              null,
          },
        },
        statusFromCode(
          error.code,
        ),
      );
    }
  },
);
