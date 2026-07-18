import type {
  GetNextGameInput,
  GameType,
} from "../core/GameTypes.ts";
import { GameEngineError } from "../core/GameErrors.ts";
import { UsersRepo } from "../repositories/UsersRepo.ts";
import { ContentRepo } from "../repositories/ContentRepo.ts";
import { HistoryRepo } from "../repositories/HistoryRepo.ts";
import { AntiCheatService } from "./AntiCheatService.ts";

function secureRandomItem<T>(items: T[]): T | null {
  if (items.length === 0) {
    return null;
  }

  const values = new Uint32Array(1);
  crypto.getRandomValues(values);

  return items[values[0] % items.length];
}

function sanitizeContent(type: GameType, item: any) {
  const safeItem = { ...item };

  delete safeItem.correct_answer;
  delete safeItem.answer;

  if (type === "find_difference") {
    delete safeItem.differences_data;
  }

  return safeItem;
}

export class GetNextGameService {
  static async execute(input: GetNextGameInput) {
    AntiCheatService.validateGetNextGame(input);

    const user = await UsersRepo.getById(input.user_id);

    const language = input.language ?? "en";

    const [content, playedIds] = await Promise.all([
      ContentRepo.getActive({
        type: input.type,
        language,
        category: input.category,
        difficulty: input.difficulty,
        limit: 200,
      }),

      HistoryRepo.playedIds(
        input.type,
        Number(user.telegram_id),
      ),
    ]);

    const available = content.filter(
      (item: any) => !playedIds.has(item.id),
    );

    const selected = secureRandomItem(available);

    if (!selected) {
      return {
        type: input.type,
        item: null,
        empty: true,
        exhausted: content.length > 0,
        message:
          content.length === 0
            ? "No active content is available"
            : "The user has completed all available content",
      };
    }

    await ContentRepo.incrementUsed(
      input.type,
      selected,
    );

    return {
      type: input.type,
      item: sanitizeContent(input.type, selected),
      empty: false,
      exhausted: false,
    };
  }
}