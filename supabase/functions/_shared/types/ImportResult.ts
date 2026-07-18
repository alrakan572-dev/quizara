export interface ImportResult {
  success: boolean;
  source: string;
  imported: number;
  skipped: number;
  error?: string;
}