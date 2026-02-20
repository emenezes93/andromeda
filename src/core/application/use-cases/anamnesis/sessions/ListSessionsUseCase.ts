import type {
  ISessionRepository,
  SessionListEntry,
} from '@ports/repositories/ISessionRepository.js';

export interface ListSessionsRequest {
  tenantId: string;
  page: number;
  limit: number;
  status?: string;
  templateId?: string;
  patientId?: string;
}

export interface ListSessionsResponse {
  data: SessionListEntry[];
  meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
}

export class ListSessionsUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(request: ListSessionsRequest): Promise<ListSessionsResponse> {
    const { data, total } = await this.sessionRepository.findAll(request.tenantId, {
      page: request.page,
      limit: request.limit,
      status: request.status,
      templateId: request.templateId,
      patientId: request.patientId,
    });
    const totalPages = Math.ceil(total / request.limit) || 1;
    return {
      data,
      meta: {
        page: request.page,
        limit: request.limit,
        total,
        totalPages,
        hasMore: request.page * request.limit < total,
      },
    };
  }
}
