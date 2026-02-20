import type { IStatsRepository } from '@ports/repositories/IStatsRepository.js';

export interface GetTemplateReportRequest {
  tenantId: string;
  templateId: string;
  from?: string;
  to?: string;
  days?: number;
}

export class GetTemplateReportUseCase {
  constructor(private readonly statsRepository: IStatsRepository) {}

  async execute(request: GetTemplateReportRequest) {
    return this.statsRepository.getTemplateReport(
      request.tenantId,
      request.templateId,
      { from: request.from, to: request.to, days: request.days }
    );
  }
}
