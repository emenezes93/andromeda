import { describe, it, expect } from 'vitest';
import { PLAN_LIMITS, getLimits } from '@config/planLimits.js';

describe('PLAN_LIMITS', () => {
  describe('free tier', () => {
    it('allows max 3 patients', () => {
      expect(PLAN_LIMITS.free.maxPatients).toBe(3);
    });

    it('allows max 10 sessions per month', () => {
      expect(PLAN_LIMITS.free.maxSessionsPerMonth).toBe(10);
    });

    it('does not enable AI insights', () => {
      expect(PLAN_LIMITS.free.aiInsightsEnabled).toBe(false);
    });
  });

  describe('solo tier', () => {
    it('allows max 50 patients', () => {
      expect(PLAN_LIMITS.solo.maxPatients).toBe(50);
    });

    it('has unlimited sessions per month', () => {
      expect(PLAN_LIMITS.solo.maxSessionsPerMonth).toBeNull();
    });

    it('enables AI insights', () => {
      expect(PLAN_LIMITS.solo.aiInsightsEnabled).toBe(true);
    });
  });

  describe('clinic tier', () => {
    it('allows max 300 patients', () => {
      expect(PLAN_LIMITS.clinic.maxPatients).toBe(300);
    });

    it('has unlimited sessions per month', () => {
      expect(PLAN_LIMITS.clinic.maxSessionsPerMonth).toBeNull();
    });

    it('enables AI insights', () => {
      expect(PLAN_LIMITS.clinic.aiInsightsEnabled).toBe(true);
    });
  });

  describe('pro tier', () => {
    it('has unlimited patients', () => {
      expect(PLAN_LIMITS.pro.maxPatients).toBeNull();
    });

    it('has unlimited sessions per month', () => {
      expect(PLAN_LIMITS.pro.maxSessionsPerMonth).toBeNull();
    });

    it('enables AI insights', () => {
      expect(PLAN_LIMITS.pro.aiInsightsEnabled).toBe(true);
    });
  });

  it('all tiers are present', () => {
    expect(Object.keys(PLAN_LIMITS)).toEqual(
      expect.arrayContaining(['free', 'solo', 'clinic', 'pro'])
    );
  });
});

describe('getLimits()', () => {
  it('returns correct limits for each known tier', () => {
    expect(getLimits('free')).toEqual(PLAN_LIMITS.free);
    expect(getLimits('solo')).toEqual(PLAN_LIMITS.solo);
    expect(getLimits('clinic')).toEqual(PLAN_LIMITS.clinic);
    expect(getLimits('pro')).toEqual(PLAN_LIMITS.pro);
  });

  it('falls back to free plan for unknown tier', () => {
    expect(getLimits('unknown')).toEqual(PLAN_LIMITS.free);
  });

  it('falls back to free plan for empty string', () => {
    expect(getLimits('')).toEqual(PLAN_LIMITS.free);
  });

  it('falls back to free plan for unrecognised string', () => {
    expect(getLimits('enterprise')).toEqual(PLAN_LIMITS.free);
    expect(getLimits('PREMIUM')).toEqual(PLAN_LIMITS.free);
  });

  it('free fallback has AI disabled', () => {
    expect(getLimits('bogus').aiInsightsEnabled).toBe(false);
  });
});
