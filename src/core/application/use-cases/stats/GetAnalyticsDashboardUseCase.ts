import type { IStatsRepository } from '@ports/repositories/IStatsRepository.js';
import type { AnalyticsDashboardResult } from '@ports/repositories/IStatsRepository.js';

export interface GetAnalyticsDashboardRequest {
  tenantId: string;
  periodDays: number;
}

export class GetAnalyticsDashboardUseCase {
  constructor(private readonly statsRepository: IStatsRepository) {}

  async execute(request: GetAnalyticsDashboardRequest): Promise<AnalyticsDashboardResult> {
    const periodDays = Math.min(365, Math.max(7, request.periodDays));
    return this.statsRepository.getAnalyticsDashboard(request.tenantId, { periodDays });
  }
}
