import { genreConfig } from './genreConfig';
import type {
  AppGenre,
  Difficulty,
  GenerateOptions,
  GenreKey,
  PlanGateInput,
  PlanGateResult,
  ResolveQuestionCountInput,
} from '../types';

/** 無料：1日あたりの生成回数上限（app.js の localStorage と値を一致させる） */
export const FREE_GENERATION_LIMIT = 3;

export const PRO_QUESTION_COUNT_OPTIONS = [5, 10, 15, 20, 25] as const;

export class PlanRuleError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'PlanRuleError';
  }
}

/** 別名ジャンル → 実際のビルダー向けキーへ */
export function normalizeGenerateOptions(options: GenerateOptions): GenerateOptions {
  const g = options.genre;
  if (g === 'gojuon') {
    return { ...options, genre: 'hiragana' };
  }
  if (g === 'katakana') {
    return { ...options, genre: 'hiragana', gojuonMode: 'katakana' };
  }
  if (g === 'bunshou') {
    return { ...options, genre: 'sentence' };
  }
  return options;
}

/**
 * 構造ルール（生成直前）
 * 無料の日次回数・体験消費は validateGenerationGate で扱う
 */
export function validatePlan(options: GenerateOptions): void {
  const o = normalizeGenerateOptions(options);
  const meta = genreConfig[o.genre as AppGenre];
  if (!meta) {
    throw new PlanRuleError('未対応ジャンル', 'UNKNOWN_GENRE');
  }
  if (meta.proOnly && !o.isPro) {
    throw new PlanRuleError('このジャンルは有料版です', 'PRO_REQUIRED');
  }
  if (o.questionCount < 1) {
    throw new PlanRuleError('問題数が不正です', 'INVALID_COUNT');
  }
  const max = o.isPro ? Math.max(...PRO_QUESTION_COUNT_OPTIONS) : 5;
  const specialTen = o.genre === 'hiragana' && o.difficulty === 'beginner';
  if (!specialTen && o.questionCount > max) {
    throw new PlanRuleError('問題数が上限を超えています', 'COUNT_CAP');
  }
}

export function resolveQuestionCount(input: ResolveQuestionCountInput): number {
  if (input.genre === 'hiragana' && input.difficulty === 'beginner') {
    return 10;
  }
  if (input.isPro) {
    const n = input.selectedProCount;
    if (typeof n === 'number' && PRO_QUESTION_COUNT_OPTIONS.includes(n as (typeof PRO_QUESTION_COUNT_OPTIONS)[number])) {
      return n;
    }
    return 5;
  }
  return 5;
}

/** 画面側の生成ボタン前チェック（localStorage 由来の値は呼び出し元で渡す） */
export function validateGenerationGate(input: PlanGateInput): PlanGateResult {
  if (!input.isPro) {
    if (input.freeGenerationsUsed >= FREE_GENERATION_LIMIT) {
      return {
        ok: false,
        kind: 'quota',
        message: `無料版は1日${FREE_GENERATION_LIMIT}回までです。有料版（月額300円・回数無制限）をご利用ください。`,
      };
    }
    if (input.difficulty === 'advanced') {
      return { ok: false, kind: 'advanced_locked', message: '上級は有料版で利用可能です' };
    }
    if (input.genre === 'custom') {
      return { ok: false, kind: 'custom_locked' };
    }
    if (input.genre === 'maze_hiragana') {
      return { ok: false, kind: 'maze_hiragana_locked', message: 'ひらがな迷路は有料版で利用できます' };
    }
    if (
      (input.genre === 'sentence' || input.genre === 'narabikae') &&
      input.premiumGenreTrialConsumed
    ) {
      return { ok: false, kind: 'premium_trial_exhausted' };
    }
  }
  return { ok: true };
}

/** レジストリ用に GenreKey → AppGenre */
export function toBuilderGenreKey(g: GenreKey): AppGenre {
  const o = normalizeGenerateOptions({
    genre: g,
    difficulty: 'beginner',
    questionCount: 5,
    isPro: true,
  });
  return o.genre as AppGenre;
}
