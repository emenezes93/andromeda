import type { ITemplateRepository } from '@ports/repositories/ITemplateRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface GetTemplateRequest {
  templateId: string;
  tenantId: string;
}

export interface GetTemplateResponse {
  id: string;
  tenantId: string;
  name: string;
  version: number;
  schemaJson: unknown;
  llmPrompt: string | null;
  llmFinetunedModel: string | null;
  createdAt: Date;
}

export class GetTemplateUseCase {
  constructor(private readonly templateRepository: ITemplateRepository) {}

  async execute(request: GetTemplateRequest): Promise<GetTemplateResponse> {
    const template = await this.templateRepository.findById(request.templateId, request.tenantId);
    if (!template || template.isDeleted()) throw new NotFoundError('Template not found');
    return {
      id: template.id,
      tenantId: template.tenantId,
      name: template.name,
      version: template.version,
      schemaJson: template.schemaJson,
      llmPrompt: template.llmPrompt,
      llmFinetunedModel: template.llmFinetunedModel,
      createdAt: template.createdAt,
    };
  }
}
