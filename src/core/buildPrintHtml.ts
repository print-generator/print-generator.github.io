import { getPrintGenerator } from '../types/printGenerator';
import type { Difficulty } from '../types';

export interface BuildPrintHtmlArgs {
  content: string;
  level: Difficulty;
  count: number;
  showName: boolean;
  showDate: boolean;
  customPayload: unknown;
  wantAnswers: boolean;
  allowKatakana: boolean;
  kanaMode: string;
}

/** 既存 generator.js の generatePrintHTML を型付きで呼び出す */
export function buildPrintHtml(args: BuildPrintHtmlArgs): string {
  const pg = getPrintGenerator();
  return pg.generatePrintHTML(
    args.content,
    args.level,
    args.count,
    args.showName,
    args.showDate,
    args.customPayload,
    args.wantAnswers,
    args.allowKatakana,
    args.kanaMode
  );
}
