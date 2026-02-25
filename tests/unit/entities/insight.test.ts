import { describe, it, expect } from 'vitest';
import { Insight } from '@domain/entities/Insight.js';
import type { RisksPayload } from '@domain/entities/Insight.js';

const makeInsight = (risks: Partial<RisksPayload> = {}, answersHash: string | null = 'abc123') =>
  new Insight(
    'ins-1',
    't-1',
    's-1',
    'Summary text',
    {
      readiness: risks.readiness ?? 50,
      dropoutRisk: risks.dropoutRisk ?? 30,
      stress: risks.stress ?? 40,
      sleepQuality: risks.sleepQuality ?? 60,
    },
    ['Recomendação 1', 'Recomendação 2'],
    answersHash,
    new Date(),
  );

describe('Insight entity', () => {
  describe('getRiskLevel()', () => {
    it('returns "low" when all metrics are below 50', () => {
      const insight = makeInsight({ stress: 20, dropoutRisk: 20, sleepQuality: 80 });
      expect(insight.getRiskLevel()).toBe('low');
    });

    it('returns "medium" when stress is between 50 and 69', () => {
      const insight = makeInsight({ stress: 60, dropoutRisk: 20, sleepQuality: 80 });
      expect(insight.getRiskLevel()).toBe('medium');
    });

    it('returns "medium" when dropoutRisk is between 50 and 69', () => {
      const insight = makeInsight({ stress: 20, dropoutRisk: 55, sleepQuality: 80 });
      expect(insight.getRiskLevel()).toBe('medium');
    });

    it('returns "medium" when sleepQuality is low (100 - sleepQuality >= 50)', () => {
      const insight = makeInsight({ stress: 20, dropoutRisk: 20, sleepQuality: 40 });
      // 100 - 40 = 60, which is >= 50
      expect(insight.getRiskLevel()).toBe('medium');
    });

    it('returns "high" when stress >= 70', () => {
      const insight = makeInsight({ stress: 75, dropoutRisk: 20, sleepQuality: 80 });
      expect(insight.getRiskLevel()).toBe('high');
    });

    it('returns "high" when dropoutRisk >= 70', () => {
      const insight = makeInsight({ stress: 20, dropoutRisk: 70, sleepQuality: 80 });
      expect(insight.getRiskLevel()).toBe('high');
    });

    it('returns "high" when sleepQuality is very low (100 - sleepQuality >= 70)', () => {
      // 100 - 20 = 80 >= 70
      const insight = makeInsight({ stress: 20, dropoutRisk: 20, sleepQuality: 20 });
      expect(insight.getRiskLevel()).toBe('high');
    });

    it('returns "high" at the exact 70 threshold', () => {
      const insight = makeInsight({ stress: 70, dropoutRisk: 20, sleepQuality: 80 });
      expect(insight.getRiskLevel()).toBe('high');
    });

    it('returns "medium" at the exact 50 threshold', () => {
      const insight = makeInsight({ stress: 50, dropoutRisk: 20, sleepQuality: 80 });
      expect(insight.getRiskLevel()).toBe('medium');
    });
  });

  describe('isHighRisk()', () => {
    it('returns true when getRiskLevel() is "high"', () => {
      expect(makeInsight({ stress: 80 }).isHighRisk()).toBe(true);
    });

    it('returns false when getRiskLevel() is "medium"', () => {
      expect(makeInsight({ stress: 55, dropoutRisk: 20, sleepQuality: 80 }).isHighRisk()).toBe(false);
    });

    it('returns false when getRiskLevel() is "low"', () => {
      expect(makeInsight({ stress: 10, dropoutRisk: 10, sleepQuality: 90 }).isHighRisk()).toBe(false);
    });
  });

  describe('isCached()', () => {
    it('returns true when answersHash is a non-empty string', () => {
      expect(makeInsight({}, 'abc123hash').isCached()).toBe(true);
    });

    it('returns false when answersHash is null', () => {
      expect(makeInsight({}, null).isCached()).toBe(false);
    });

    it('returns false when answersHash is an empty string', () => {
      expect(makeInsight({}, '').isCached()).toBe(false);
    });
  });
});
