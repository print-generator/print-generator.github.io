import type { AppGenre } from '../types';

export interface GenreDefinition {
  key: AppGenre;
  label: string;
  proOnly: boolean;
  hasDifficulty: boolean;
  hasCustomInput: boolean;
  hasGojuonMode: boolean;
}

/** ジャンルメタ（UIバッジ・将来の学年別漢字などの追加に利用） */
export const genreConfig: Record<AppGenre, GenreDefinition> = {
  joshi: {
    key: 'joshi',
    label: '助詞',
    proOnly: false,
    hasDifficulty: true,
    hasCustomInput: false,
    hasGojuonMode: false,
  },
  hiragana: {
    key: 'hiragana',
    label: '五十音',
    proOnly: false,
    hasDifficulty: true,
    hasCustomInput: false,
    hasGojuonMode: true,
  },
  maze: {
    key: 'maze',
    label: 'めいろ',
    proOnly: false,
    hasDifficulty: true,
    hasCustomInput: false,
    hasGojuonMode: false,
  },
  maze_hiragana: {
    key: 'maze_hiragana',
    label: 'ひらがな迷路',
    proOnly: true,
    hasDifficulty: true,
    hasCustomInput: false,
    hasGojuonMode: false,
  },
  sentence: {
    key: 'sentence',
    label: '文章問題',
    proOnly: true,
    hasDifficulty: true,
    hasCustomInput: false,
    hasGojuonMode: false,
  },
  narabikae: {
    key: 'narabikae',
    label: '並び替え',
    proOnly: true,
    hasDifficulty: true,
    hasCustomInput: false,
    hasGojuonMode: false,
  },
  custom: {
    key: 'custom',
    label: 'カスタム',
    proOnly: true,
    hasDifficulty: true,
    hasCustomInput: true,
    hasGojuonMode: false,
  },
};

export function getGenreDefinition(genre: AppGenre): GenreDefinition {
  return genreConfig[genre];
}
