/**
 * Domain Entity: AI Insight for an anamnesis session
 */
export type RiskLevel = 'low' | 'medium' | 'high';

export interface RisksPayload {
  readiness: number;
  dropoutRisk: number;
  stress: number;
  sleepQuality: number;
}

export class Insight {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly sessionId: string,
    public readonly summary: string,
    public readonly risksJson: RisksPayload,
    public readonly recommendationsJson: string[],
    public readonly answersHash: string | null,
    public readonly createdAt: Date
  ) {}

  getRiskLevel(): RiskLevel {
    const r = this.risksJson;
    const max = Math.max(r.stress ?? 0, 100 - (r.sleepQuality ?? 50), r.dropoutRisk ?? 0);
    if (max >= 70) return 'high';
    if (max >= 50) return 'medium';
    return 'low';
  }

  isHighRisk(): boolean {
    return this.getRiskLevel() === 'high';
  }

  isCached(): boolean {
    return this.answersHash != null && this.answersHash.length > 0;
  }
}
