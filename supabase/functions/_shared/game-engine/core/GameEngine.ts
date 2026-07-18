import type {
  GetNextGameInput,
  SubmitAnswerInput,
  GameEngineResult,
} from "./GameTypes.ts";

import { success, failure } from "./GameResponse.ts";

export class GameEngine {
  static async getNextGame(
    input: GetNextGameInput,
    handler: (input: GetNextGameInput) => Promise<unknown>
  ): Promise<GameEngineResult> {
    try {
      const data = await handler(input);
      return success(data);
    } catch (error) {
      return failure(error);
    }
  }

  static async submitAnswer(
    input: SubmitAnswerInput,
    handler: (input: SubmitAnswerInput) => Promise<unknown>
  ): Promise<GameEngineResult> {
    try {
      const data = await handler(input);
      return success(data);
    } catch (error) {
      return failure(error);
    }
  }
}