import crypto from 'crypto';
import type { TemplateSchemaJson } from '@shared/types/index.js';

/**
 * Generate a hash from template and answers for similarity caching.
 * Sessions with identical template structure and answers will have the same hash.
 */
export function generateAnswersHash(
  template: TemplateSchemaJson,
  answers: Record<string, unknown>
): string {
  // Normalize template structure (only question IDs matter for matching)
  const templateKey = {
    questionIds: template.questions?.map((q) => q.id).sort() ?? [],
  };

  // Normalize answers (sort keys, stringify values)
  const normalizedAnswers = Object.keys(answers)
    .sort()
    .reduce((acc, key) => {
      acc[key] = answers[key];
      return acc;
    }, {} as Record<string, unknown>);

  const combined = JSON.stringify({ templateKey, answers: normalizedAnswers });
  return crypto.createHash('sha256').update(combined).digest('hex');
}
