import type { IStatsRepository } from '@ports/repositories/IStatsRepository.js';

export interface GetDashboardStatsRequest {
  tenantId: string;
  from?: string;
  to?: string;
  days?: number;
  pendingDays?: number;
  highRiskThreshold?: number;
}

export class GetDashboardStatsUseCase {
  constructor(private readonly statsRepository: IStatsRepository) {}

  async execute(request: GetDashboardStatsRequest) {
    return this.statsRepository.getDashboard(request.tenantId, {
      from: request.from,
      to: request.to,
      days: request.days,
      pendingDays: request.pendingDays,
      highRiskThreshold: request.highRiskThreshold,
    });
  }
}
