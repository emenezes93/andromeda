import { describe, it, expect } from 'vitest';
import { AnamnesisSession } from '@domain/entities/AnamnesisSession.js';

const makeSession = (overrides: {
  status?: 'in_progress' | 'completed';
  deletedAt?: Date | null;
} = {}) =>
  new AnamnesisSession(
    's-1',
    't-1',
    'tpl-1',
    'user-1',
    'patient-1',
    overrides.status ?? 'in_progress',
    null,
    null,
    null,
    new Date('2024-01-01'),
    overrides.deletedAt !== undefined ? overrides.deletedAt : null,
    {},
  );

describe('AnamnesisSession entity', () => {
  describe('isCompleted()', () => {
    it('returns false when status is in_progress', () => {
      expect(makeSession({ status: 'in_progress' }).isCompleted()).toBe(false);
    });

    it('returns true when status is completed', () => {
      expect(makeSession({ status: 'completed' }).isCompleted()).toBe(true);
    });
  });

  describe('canReceiveAnswer()', () => {
    it('returns true for in_progress non-deleted session', () => {
      expect(makeSession().canReceiveAnswer()).toBe(true);
    });

    it('returns false for completed session', () => {
      expect(makeSession({ status: 'completed' }).canReceiveAnswer()).toBe(false);
    });

    it('returns false for deleted session even if in_progress', () => {
      expect(makeSession({ deletedAt: new Date() }).canReceiveAnswer()).toBe(false);
    });

    it('returns false for completed and deleted session', () => {
      expect(
        makeSession({ status: 'completed', deletedAt: new Date() }).canReceiveAnswer()
      ).toBe(false);
    });
  });

  describe('isDeleted()', () => {
    it('returns false when deletedAt is null', () => {
      expect(makeSession().isDeleted()).toBe(false);
    });

    it('returns true when deletedAt is set', () => {
      expect(makeSession({ deletedAt: new Date() }).isDeleted()).toBe(true);
    });
  });

  it('stores currentAnswersJson', () => {
    const answers = { q1: 'yes', q2: 5 };
    const s = new AnamnesisSession(
      's-1', 't-1', 'tpl-1', null, null,
      'in_progress', null, null, null, new Date(), null, answers
    );
    expect(s.currentAnswersJson).toEqual(answers);
  });
});
