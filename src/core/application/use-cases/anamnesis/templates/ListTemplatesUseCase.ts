import type { ITemplateRepository } from '@ports/repositories/ITemplateRepository.js';

export interface ListTemplatesRequest {
  tenantId: string;
  page: number;
  limit: number;
}

export interface ListTemplatesResponse {
  data: Array<{
    id: string;
    tenantId: string;
    name: string;
    version: number;
    schemaJson: unknown;
    llmPrompt: string | null;
    llmFinetunedModel: string | null;
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

export class ListTemplatesUseCase {
  constructor(private readonly templateRepository: ITemplateRepository) {}

  async execute(request: ListTemplatesRequest): Promise<ListTemplatesResponse> {
    const { data, total } = await this.templateRepository.findAll(request.tenantId, {
      page: request.page,
      limit: request.limit,
    });
    const totalPages = Math.ceil(total / request.limit) || 1;
    return {
      data: data.map((t) => ({
        id: t.id,
        tenantId: t.tenantId,
        name: t.name,
        version: t.version,
        schemaJson: t.schemaJson,
        llmPrompt: t.llmPrompt,
        llmFinetunedModel: t.llmFinetunedModel,
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
