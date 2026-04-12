import type { AppGenre, GenerateOptions, Problem } from '../types';
import { generateJoshi } from './joshi';
import { generateHiragana } from './hiragana';
import { generateKatakana } from './katakana';
import { generateGojuon } from './gojuon';
import { generateBunshou } from './bunshou';
import { generateMaze, generateMazeHiragana } from './maze';
import { generateNarabikae } from './narabikae';
import { generateCustom } from './custom';
import { generateKanji } from './kanji';

/** 実際のビルダーは AppGenre キーのみ */
const coreGenerators: Record<AppGenre, (o: GenerateOptions) => Problem[]> = {
  joshi: generateJoshi,
  hiragana: generateHiragana,
  maze: generateMaze,
  maze_hiragana: generateMazeHiragana,
  sentence: generateBunshou,
  narabikae: generateNarabikae,
  custom: generateCustom,
  kanji: generateKanji,
};

/**
 * 仕様どおりの名前付きレジストリ（別名・将来追加用）
 */
const generators: Record<string, (o: GenerateOptions) => Problem[]> = {
  joshi: generateJoshi,
  hiragana: generateHiragana,
  katakana: generateKatakana,
  gojuon: generateGojuon,
  bunshou: generateBunshou,
  sentence: generateBunshou,
  maze: generateMaze,
  maze_hiragana: generateMazeHiragana,
  narabikae: generateNarabikae,
  custom: generateCustom,
  kanji: generateKanji,
};

export default generators;

export function runCoreGenerator(genre: AppGenre, options: GenerateOptions): Problem[] {
  const g = coreGenerators[genre];
  if (!g) throw new Error(`未対応ジャンル: ${genre}`);
  return g(options);
}
