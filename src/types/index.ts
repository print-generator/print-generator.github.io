/**
 * 問題1件の共通形（プリント用カードHTMLを question に格納）
 */
export interface Problem {
  id: string;
  type: string;
  question: string;
  answer: string;
  choices?: string[];
  meta?: Record<string, unknown>;
}

/** アプリで使うジャンルキー（UIの data-value と一致） */
export type AppGenre =
  | 'joshi'
  | 'hiragana'
  | 'maze'
  | 'maze_hiragana'
  | 'sentence'
  | 'narabikae'
  | 'custom';

/**
 * 生成API用ジャンル（将来拡張・別名）
 * gojuon / katakana / bunshou は正規化時に hiragana / sentence へ寄せる
 */
export type GenreKey = AppGenre | 'gojuon' | 'katakana' | 'bunshou';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type GojuonMode = 'hiragana' | 'katakana' | 'mix';

export interface GenerateOptions {
  genre: GenreKey;
  difficulty: Difficulty;
  questionCount: number;
  isPro: boolean;
  customWords?: string[];
  /** 五十音（UIの #kanaMode） */
  gojuonMode?: GojuonMode;
  allowKatakana?: boolean;
  customPayload?: unknown;
  sentenceTrialQuality?: boolean;
}

export interface PlanGateInput {
  isPro: boolean;
  genre: AppGenre;
  difficulty: Difficulty;
  freeGenerationsUsed: number;
  premiumGenreTrialConsumed: boolean;
}

export type PlanGateResult =
  | { ok: true }
  | {
      ok: false;
      kind: 'quota' | 'advanced_locked' | 'custom_locked' | 'maze_hiragana_locked' | 'premium_trial_exhausted';
      message?: string;
    };

export interface ResolveQuestionCountInput {
  genre: AppGenre;
  difficulty: Difficulty;
  isPro: boolean;
  /** #questionCountPro の数値（有料時） */
  selectedProCount?: number;
}
