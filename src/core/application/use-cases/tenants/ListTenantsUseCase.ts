import type { ITenantRepository } from '@ports/repositories/ITenantRepository.js';

export interface ListTenantsRequest {
  page: number;
  limit: number;
}

export interface ListTenantsResponse {
  data: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: Date;
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Use case: List all tenants (owner only, global access).
 */
export class ListTenantsUseCase {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(request: ListTenantsRequest): Promise<ListTenantsResponse> {
    const { data, total } = await this.tenantRepository.findAll({
      page: request.page,
      limit: request.limit,
    });
    const totalPages = Math.ceil(total / request.limit) || 1;
    return {
      data: data.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        createdAt: t.createdAt,
      })),
      meta: {
        page: request.page,
        limit: request.limit,
        total,
        totalPages,
        hasMore: request.page < totalPages,
      },
    };
  }
}
