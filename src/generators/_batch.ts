import type { AppGenre, GenerateOptions, Problem } from '../types';
import { getPrintGenerator } from '../types/printGenerator';

export function runBuildBatch(genre: AppGenre, options: GenerateOptions) {
  const pg = getPrintGenerator();
  return pg.buildQuestionBodyStructured(
    genre,
    options.difficulty,
    options.questionCount,
    options.customPayload ?? null,
    !!options.allowKatakana,
    options.gojuonMode ?? 'mix'
  );
}

export function toProblems(genre: string, batch: { cardHtmls: string[]; answers: string[] }): Problem[] {
  return batch.cardHtmls.map((html, i) => ({
    id: `${genre}-${i + 1}`,
    type: genre,
    question: html,
    answer: batch.answers[i] ?? '',
    meta: { index: i },
  }));
}
