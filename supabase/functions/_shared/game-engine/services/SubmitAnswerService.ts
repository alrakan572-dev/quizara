import type {
  Difficulty,
  SubmitAnswerInput,
} from "../core/GameTypes.ts";
import { GameEngineError } from "../core/GameErrors.ts";
import { UsersRepo } from "../repositories/UsersRepo.ts";
import { ContentRepo } from "../repositories/ContentRepo.ts";
import { HistoryRepo } from "../repositories/HistoryRepo.ts";
import { AntiCheatService } from "./AntiCheatService.ts";
import { PointsService } from "./PointsService.ts";
import { LeaderboardService } from "./LeaderboardService.ts";
import { ChallengeProgressService } from "./ChallengeProgressService.ts";

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase();
}

function validateDifficulty(value: unknown): Difficulty {
  if (
    value === "easy" ||
    value === "medium" ||
    value === "hard"
  ) {
    return value;
  }

  throw new GameEngineError(
    "Content difficulty is invalid",
    "INVALID_CONTENT_DIFFICULTY",
  );
}

function checkAnswer(params: {
  input: SubmitAnswerInput;
  item: any;
}): boolean {
  if (params.input.type === "find_difference") {
    return (
      Number(params.input.found_count ?? 0) >=
      Number(params.item.differences_count ?? 0)
    );
  }

  const answerIsCorrect =
    normalizeText(params.input.answer) ===
    normalizeText(params.item.correct_answer);

  if (
    params.input.type === "fastest" &&
    answerIsCorrect
  ) {
    return AntiCheatService.validateFastestTime({
      answerTimeMs: Number(
        params.input.answer_time_ms ?? 0,
      ),
      timeLimitSeconds: Number(
        params.item.time_limit ?? 0,
      ),
    });
  }

  return answerIsCorrect;
}

export class SubmitAnswerService {
  static async execute(input: SubmitAnswerInput) {
    AntiCheatService.validateSubmitAnswer(input);

    const user = await UsersRepo.getById(input.user_id);

    const item = await ContentRepo.getById(
      input.type,
      input.item_id,
    );

    if (item.active !== true) {
      throw new GameEngineError(
        "Content is not active",
        "CONTENT_NOT_ACTIVE",
      );
    }

    const playedIds = await HistoryRepo.playedIds(
      input.type,
      Number(user.telegram_id),
    );

    if (playedIds.has(input.item_id)) {
      throw new GameEngineError(
        "This answer was already submitted",
        "ANSWER_ALREADY_SUBMITTED",
      );
    }

    const isCorrect = checkAnswer({
      input,
      item,
    });

    const difficulty = validateDifficulty(
      item.difficulty,
    );

    const pointsEarned =
      await PointsService.calculate({
        type: input.type,
        difficulty,
        isCorrect,
      });

    await HistoryRepo.save({
      type: input.type,
      telegramId: Number(user.telegram_id),
      itemId: input.item_id,
      isCorrect,
      points: pointsEarned,
      answerTimeMs: Number(
        input.answer_time_ms ?? 0,
      ),
    });

    const updatedUser =
      await UsersRepo.updateAfterAnswer({
        userId: input.user_id,
        points: pointsEarned,
        isCorrect,
      });

    await Promise.all([
      LeaderboardService.recordScore({
        user: updatedUser,
        points: pointsEarned,
      }),

      ChallengeProgressService.recordAnswer({
        userId: input.user_id,
        type: input.type,
        isCorrect,
        points: pointsEarned,
      }),
    ]);

    return {
      type: input.type,
      item_id: input.item_id,
      is_correct: isCorrect,
      points_earned: pointsEarned,
      correct_answer:
        input.type === "find_difference"
          ? null
          : item.correct_answer,
      user: {
        id: updatedUser.id,
        points: updatedUser.points,
        games_played: updatedUser.games_played,
        total_correct: updatedUser.total_correct,
        total_wrong: updatedUser.total_wrong,
        level: updatedUser.level,
      },
    };
  }
}