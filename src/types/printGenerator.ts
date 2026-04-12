import type { Difficulty, GojuonMode } from './index';

export interface QuestionBodyResult {
  cardHtmls: string[];
  answers: string[];
}

export interface PrintGeneratorApi {
  buildQuestionBodyStructured: (
    content: string,
    level: Difficulty,
    count: number,
    customPayload: unknown,
    allowKatakana: boolean,
    kanaMode: GojuonMode | string
  ) => QuestionBodyResult;
  generatePrintHTML: (
    content: string,
    level: Difficulty,
    count: number,
    showName: boolean,
    showDate: boolean,
    customPayload: unknown,
    includeAnswers: boolean,
    allowKatakana: boolean,
    kanaMode: GojuonMode | string
  ) => string;
}

export function getPrintGenerator(): PrintGeneratorApi {
  const w = window as unknown as { PrintGenerator?: PrintGeneratorApi };
  if (!w.PrintGenerator) {
    throw new Error('PrintGenerator が未ロードです（generator.js を先に読み込んでください）');
  }
  return w.PrintGenerator;
}
