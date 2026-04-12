/**
 * 五十音（教材上は genre=hiragana と同一ビルダー）
 * 将来「学年別」などを差し込む場合はここを拡張
 */
import { generateHiragana } from './hiragana';
import type { GenerateOptions, Problem } from '../types';

export function generateGojuon(options: GenerateOptions): Problem[] {
  return generateHiragana({ ...options, genre: 'hiragana' });
}
