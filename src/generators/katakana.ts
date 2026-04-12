/**
 * カタカナ強調の五十音（UIキーは hiragana + gojuonMode=katakana と同等）
 */
import { generateHiragana } from './hiragana';
import type { GenerateOptions, Problem } from '../types';

export function generateKatakana(options: GenerateOptions): Problem[] {
  return generateHiragana({ ...options, genre: 'hiragana', gojuonMode: 'katakana' });
}
