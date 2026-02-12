import { describe, it, expect } from 'vitest';
import { getNextQuestion } from '../../src/modules/anamnesis/engine/engine.js';
import type { TemplateSchemaJson } from '@shared/types/index.js';

const baseSchema: TemplateSchemaJson = {
  questions: [
    { id: 'q1', text: 'Pergunta 1', type: 'text', required: true, tags: ['sleep'] },
    { id: 'q2', text: 'Pergunta 2', type: 'number', required: true, tags: ['stress'], showWhen: { questionId: 'q1', operator: 'eq', value: 'sim' } },
  ],
  conditionalLogic: [{ ifQuestion: 'q1', ifValue: 'sim', thenShow: ['q2'] }],
};

describe('getNextQuestion', () => {
  it('returns first question when no answers', () => {
    const result = getNextQuestion(baseSchema, {});
    expect(result.nextQuestion).not.toBeNull();
    expect(result.nextQuestion!.id).toBe('q1');
    expect(result.reason).toBe('conditional');
    expect(result.completionPercent).toBe(0);
  });

  it('returns null and completed when all visible questions answered', () => {
    const schema: TemplateSchemaJson = {
      questions: [
        { id: 'q1', text: 'P1', type: 'text', required: true },
      ],
    };
    const result = getNextQuestion(schema, { q1: 'done' });
    expect(result.nextQuestion).toBeNull();
    expect(result.reason).toBe('completed');
    expect(result.completionPercent).toBe(100);
  });

  it('skips conditional question when condition not met', () => {
    const result = getNextQuestion(baseSchema, { q1: 'nao' });
    expect(result.nextQuestion).toBeNull();
    expect(result.reason).toBe('completed');
  });

  it('returns deepening question when stress tag has high value', () => {
    const schema: TemplateSchemaJson = {
      questions: [
        { id: 'q3', text: 'Stress?', type: 'single', options: ['Nunca', 'Sempre'], required: true, tags: ['stress'] },
      ],
    };
    const result = getNextQuestion(schema, { q3: 'Sempre' });
    expect(result.nextQuestion).not.toBeNull();
    expect(result.nextQuestion!.id).toBe('q_deepen_stress');
    expect(result.reason).toBe('heuristic_deepen');
  });
});
