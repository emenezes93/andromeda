import type { IMembershipRepository } from '@ports/repositories/IMembershipRepository.js';

export interface ListUsersRequest {
  tenantId: string;
  page: number;
  limit: number;
  active?: boolean;
}

export interface UserListItem {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
}

export interface ListUsersResponse {
  data: UserListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Use case: List users in a tenant (with role and active from membership).
 */
export class ListUsersUseCase {
  constructor(private readonly membershipRepository: IMembershipRepository) {}

  async execute(request: ListUsersRequest): Promise<ListUsersResponse> {
    const { data, total } = await this.membershipRepository.findAllByTenantId(request.tenantId, {
      page: request.page,
      limit: request.limit,
      active: request.active,
    });
    const totalPages = Math.ceil(total / request.limit) || 1;
    return {
      data: data.map(({ user, membership }) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: membership.role,
        active: membership.active,
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
