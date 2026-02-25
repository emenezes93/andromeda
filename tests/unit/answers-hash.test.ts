import { describe, it, expect } from 'vitest';
import { generateAnswersHash } from '@shared/utils/answersHash.js';

const template = {
  questions: [
    { id: 'q1', text: 'Question 1', type: 'text' as const, required: true },
    { id: 'q2', text: 'Question 2', type: 'number' as const, required: true },
    { id: 'q3', text: 'Question 3', type: 'single' as const, required: false },
  ],
};

describe('generateAnswersHash()', () => {
  it('returns a 64-char lowercase hex string (SHA-256)', () => {
    const hash = generateAnswersHash(template, { q1: 'hello' });
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('same inputs produce the same hash', () => {
    const h1 = generateAnswersHash(template, { q1: 'hello', q2: 5 });
    const h2 = generateAnswersHash(template, { q1: 'hello', q2: 5 });
    expect(h1).toBe(h2);
  });

  it('different answer values produce different hashes', () => {
    const h1 = generateAnswersHash(template, { q1: 'hello' });
    const h2 = generateAnswersHash(template, { q1: 'world' });
    expect(h1).not.toBe(h2);
  });

  it('answer key order does not affect the hash (keys are sorted)', () => {
    const h1 = generateAnswersHash(template, { q1: 'a', q2: 1, q3: 'opt' });
    const h2 = generateAnswersHash(template, { q3: 'opt', q1: 'a', q2: 1 });
    expect(h1).toBe(h2);
  });

  it('empty answers produce a consistent hash', () => {
    const h1 = generateAnswersHash(template, {});
    const h2 = generateAnswersHash(template, {});
    expect(h1).toBe(h2);
  });

  it('different templates with same answers produce different hashes', () => {
    const tpl2 = {
      questions: [
        { id: 'x1', text: 'X', type: 'text' as const, required: true },
      ],
    };
    const h1 = generateAnswersHash(template, { q1: 'same' });
    const h2 = generateAnswersHash(tpl2, { q1: 'same' });
    expect(h1).not.toBe(h2);
  });

  it('template question order does not affect hash (question ids are sorted)', () => {
    const tpl1 = {
      questions: [
        { id: 'q1', text: 'Q1', type: 'text' as const, required: true },
        { id: 'q2', text: 'Q2', type: 'text' as const, required: true },
      ],
    };
    const tpl2 = {
      questions: [
        { id: 'q2', text: 'Q2', type: 'text' as const, required: true },
        { id: 'q1', text: 'Q1', type: 'text' as const, required: true },
      ],
    };
    const h1 = generateAnswersHash(tpl1, { q1: 'a', q2: 'b' });
    const h2 = generateAnswersHash(tpl2, { q1: 'a', q2: 'b' });
    expect(h1).toBe(h2);
  });

  it('handles template with no questions', () => {
    const hash = generateAnswersHash({ questions: [] }, {});
    expect(hash).toHaveLength(64);
  });
});
