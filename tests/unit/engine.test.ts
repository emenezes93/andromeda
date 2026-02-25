import { describe, it, expect } from 'vitest';
import { ConditionalQuestionEngine } from '@infrastructure/services/ConditionalQuestionEngine.js';
import type { TemplateSchemaJson } from '@shared/types/index.js';

const engine = new ConditionalQuestionEngine();

const baseSchema: TemplateSchemaJson = {
  questions: [
    { id: 'q1', text: 'Pergunta 1', type: 'text', required: true, tags: ['sleep'] },
    {
      id: 'q2',
      text: 'Pergunta 2',
      type: 'number',
      required: true,
      tags: ['stress'],
      showWhen: { questionId: 'q1', operator: 'eq', value: 'sim' },
    },
  ],
  conditionalLogic: [{ ifQuestion: 'q1', ifValue: 'sim', thenShow: ['q2'] }],
};

describe('ConditionalQuestionEngine', () => {
  it('returns first question when no answers', () => {
    const result = engine.selectNextQuestion(baseSchema, {});
    expect(result.nextQuestion).not.toBeNull();
    expect((result.nextQuestion as { id: string }).id).toBe('q1');
    expect(result.reason).toBe('conditional');
    expect(result.completionPercent).toBe(0);
  });

  it('returns null and completed when all visible questions answered', () => {
    const schema: TemplateSchemaJson = {
      questions: [{ id: 'q1', text: 'P1', type: 'text', required: true }],
    };
    const result = engine.selectNextQuestion(schema, { q1: 'done' });
    expect(result.nextQuestion).toBeNull();
    expect(result.reason).toBe('completed');
    expect(result.completionPercent).toBe(100);
  });

  it('skips conditional question when condition not met', () => {
    const result = engine.selectNextQuestion(baseSchema, { q1: 'nao' });
    expect(result.nextQuestion).toBeNull();
    expect(result.reason).toBe('completed');
  });

  it('shows conditional question when condition is met', () => {
    const result = engine.selectNextQuestion(baseSchema, { q1: 'sim' });
    expect(result.nextQuestion).not.toBeNull();
    expect((result.nextQuestion as { id: string }).id).toBe('q2');
  });

  it('returns deepening question when stress tag has high value', () => {
    const schema: TemplateSchemaJson = {
      questions: [
        {
          id: 'q3',
          text: 'Stress?',
          type: 'single',
          options: ['Nunca', 'Sempre'],
          required: true,
          tags: ['stress'],
        },
      ],
    };
    const result = engine.selectNextQuestion(schema, { q3: 'Sempre' });
    expect(result.nextQuestion).not.toBeNull();
    expect((result.nextQuestion as { id: string }).id).toBe('q_deepen_stress');
    expect(result.reason).toBe('heuristic_deepen');
  });

  it('does not re-ask deepening question when already answered', () => {
    const schema: TemplateSchemaJson = {
      questions: [
        {
          id: 'q3',
          text: 'Stress?',
          type: 'single',
          options: ['Nunca', 'Sempre'],
          required: true,
          tags: ['stress'],
        },
      ],
    };
    const result = engine.selectNextQuestion(schema, {
      q3: 'Sempre',
      q_deepen_stress: 'Trabalho',
    });
    expect(result.nextQuestion).toBeNull();
    expect(result.reason).toBe('completed');
  });

  it('calculates completionPercent correctly', () => {
    const schema: TemplateSchemaJson = {
      questions: [
        { id: 'a', text: 'A', type: 'text', required: true },
        { id: 'b', text: 'B', type: 'text', required: true },
        { id: 'c', text: 'C', type: 'text', required: true },
        { id: 'd', text: 'D', type: 'text', required: true },
      ],
    };
    const result = engine.selectNextQuestion(schema, { a: '1', b: '2' });
    expect(result.completionPercent).toBe(50);
  });
});
