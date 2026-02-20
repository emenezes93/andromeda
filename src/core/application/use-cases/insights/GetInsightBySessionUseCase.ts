import type { IInsightRepository } from '@ports/repositories/IInsightRepository.js';
import type { Insight } from '@domain/entities/Insight.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface GetInsightBySessionRequest {
  sessionId: string;
  tenantId: string;
}

export class GetInsightBySessionUseCase {
  constructor(private readonly insightRepository: IInsightRepository) {}

  async execute(request: GetInsightBySessionRequest): Promise<Insight> {
    const insight = await this.insightRepository.findBySessionId(
      request.sessionId,
      request.tenantId
    );
    if (!insight) throw new NotFoundError('Insights not found for this session');
    return insight;
  }
}
