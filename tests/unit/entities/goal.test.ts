import { describe, it, expect } from 'vitest';
import { Goal } from '@domain/entities/Goal.js';

const makeGoal = (overrides: {
  currentValue?: number | null;
  targetValue?: number;
  achievedAt?: Date | null;
  deletedAt?: Date | null;
} = {}) =>
  new Goal(
    'goal-1',
    't-1',
    'p-1',
    'weight_loss',
    'Perder 10kg',
    'Meta de emagrecimento',
    overrides.currentValue !== undefined ? overrides.currentValue : null,
    overrides.targetValue ?? 100,
    'kg',
    new Date('2024-01-01'),
    new Date('2024-12-31'),
    overrides.achievedAt !== undefined ? overrides.achievedAt : null,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
    overrides.deletedAt !== undefined ? overrides.deletedAt : null,
  );

describe('Goal entity', () => {
  describe('isAchieved()', () => {
    it('returns false when achievedAt is null', () => {
      expect(makeGoal().isAchieved()).toBe(false);
    });

    it('returns true when achievedAt is set', () => {
      expect(makeGoal({ achievedAt: new Date() }).isAchieved()).toBe(true);
    });
  });

  describe('isDeleted()', () => {
    it('returns false when deletedAt is null', () => {
      expect(makeGoal().isDeleted()).toBe(false);
    });

    it('returns true when deletedAt is set', () => {
      expect(makeGoal({ deletedAt: new Date() }).isDeleted()).toBe(true);
    });
  });

  describe('progressPercent()', () => {
    it('returns null when currentValue is null', () => {
      expect(makeGoal({ currentValue: null }).progressPercent()).toBeNull();
    });

    it('returns 0 when currentValue is 0', () => {
      expect(makeGoal({ currentValue: 0, targetValue: 100 }).progressPercent()).toBe(0);
    });

    it('returns 50 when halfway to goal', () => {
      expect(makeGoal({ currentValue: 50, targetValue: 100 }).progressPercent()).toBe(50);
    });

    it('returns 100 when currentValue equals targetValue', () => {
      expect(makeGoal({ currentValue: 100, targetValue: 100 }).progressPercent()).toBe(100);
    });

    it('clamps to 100 when currentValue exceeds targetValue', () => {
      expect(makeGoal({ currentValue: 150, targetValue: 100 }).progressPercent()).toBe(100);
    });

    it('clamps to 0 when currentValue is negative', () => {
      expect(makeGoal({ currentValue: -10, targetValue: 100 }).progressPercent()).toBe(0);
    });

    it('handles fractional progress', () => {
      const progress = makeGoal({ currentValue: 33, targetValue: 100 }).progressPercent();
      expect(progress).toBe(33);
    });
  });
});
