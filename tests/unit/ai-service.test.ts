import { describe, it, expect } from 'vitest';
import { generateInsightsRuleBased, generateInsightsLlmMock, generateInsights } from '../../src/modules/ai/service.js';
import type { TemplateSchemaJson } from '@shared/types/index.js';

const template: TemplateSchemaJson = {
  questions: [
    { id: 'q1', text: 'Sono', type: 'number', required: true, tags: ['sleep'] },
    { id: 'q3', text: 'Stress', type: 'single', options: ['Nunca', 'Sempre'], required: true, tags: ['stress'] },
  ],
};

describe('generateInsightsRuleBased', () => {
  it('returns summary, risks 0-100, and recommendations', () => {
    const out = generateInsightsRuleBased(template, { q1: 3, q3: 'Sempre' });
    expect(out.summary).toBeDefined();
    expect(typeof out.summary).toBe('string');
    expect(out.risks.readiness).toBeGreaterThanOrEqual(0);
    expect(out.risks.readiness).toBeLessThanOrEqual(100);
    expect(out.risks.stress).toBeGreaterThanOrEqual(0);
    expect(out.risks.stress).toBeLessThanOrEqual(100);
    expect(out.risks.sleepQuality).toBeGreaterThanOrEqual(0);
    expect(out.risks.dropoutRisk).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(out.recommendations)).toBe(true);
  });

  it('elevates stress score when q3 is Sempre', () => {
    const out = generateInsightsRuleBased(template, { q3: 'Sempre' });
    expect(out.risks.stress).toBeGreaterThan(70);
  });
});

describe('generateInsightsLlmMock', () => {
  it('returns deterministic varied output', () => {
    const out = generateInsightsLlmMock(template, { q1: 5 });
    expect(out.summary).toBeDefined();
    expect(out.risks.readiness).toBeGreaterThanOrEqual(0);
    expect(out.risks.readiness).toBeLessThanOrEqual(100);
    expect(out.recommendations.length).toBeGreaterThanOrEqual(1);
  });
});

describe('generateInsights', () => {
  it('uses ruleBased when mode is ruleBased', () => {
    const out = generateInsights('ruleBased', template, { q3: 'Sempre' });
    expect(out.risks.stress).toBeGreaterThan(70);
  });

  it('uses llmMock when mode is llmMock', () => {
    const out = generateInsights('llmMock', template, {});
    expect(out.summary).toBeDefined();
    expect(out.risks).toBeDefined();
  });
});
