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
  | 'custom'
  | 'kanji';

/**
 * 生成API用ジャンル（将来拡張・別名）
 * gojuon / katakana / bunshou は正規化時に hiragana / sentence へ寄せる
 */
export type GenreKey = AppGenre | 'gojuon' | 'katakana' | 'bunshou';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type GojuonMode = 'hiragana' | 'katakana' | 'mix';

/** 漢字：学年（2〜6年はデータ追加後に利用） */
export type KanjiGrade = 1 | 2 | 3 | 4 | 5 | 6;

/** 漢字：出題タイプ */
export type KanjiMode = 'reading' | 'writing';

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
  /** 漢字：学年（既定 1） */
  kanjiGrade?: KanjiGrade;
  /** 漢字：読み／書き（既定 reading） */
  kanjiMode?: KanjiMode;
}

export interface PlanGateInput {
  isPro: boolean;
  genre: AppGenre;
  difficulty: Difficulty;
  freeGenerationsUsed: number;
  /** 無料版かつ当該ジャンルで「本日の体験」を既に消費したか（日付リセットは app 側） */
  premiumGenreTrialConsumed: boolean;
  /**
   * 旧 bundle 互換：迷路で本日体験済みなら true（app は迷路ジャンル時に premium と同趣旨で渡す）
   */
  mazeHiraganaTrialConsumed: boolean;
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
