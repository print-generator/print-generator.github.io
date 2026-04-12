import type { AppGenre, GenerateOptions, Problem } from '../types';
import { runBuildBatch, toProblems } from './_batch';

export function createGenreGenerator(genre: AppGenre) {
  return function generate(options: GenerateOptions): Problem[] {
    const batch = runBuildBatch(genre, options);
    return toProblems(genre, batch);
  };
}
