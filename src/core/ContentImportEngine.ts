import { ContentImportService } from "../services/ContentImportService";

export class ContentImportEngine {
  static async importQuestions(params: {
    amount?: number;
    language?: string;
    category?: string;
    difficulty?: string;
  } = {}) {
    return await ContentImportService.importQuestions(params);
  }
}