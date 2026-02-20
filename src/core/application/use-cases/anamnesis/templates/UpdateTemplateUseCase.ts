import type { ITemplateRepository } from '@ports/repositories/ITemplateRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface UpdateTemplateRequest {
  templateId: string;
  tenantId: string;
  name?: string;
  schemaJson?: unknown;
}

export interface UpdateTemplateResponse {
  id: string;
  tenantId: string;
  name: string;
  version: number;
  schemaJson: unknown;
  llmPrompt: string | null;
  llmFinetunedModel: string | null;
  createdAt: Date;
}

export class UpdateTemplateUseCase {
  constructor(private readonly templateRepository: ITemplateRepository) {}

  async execute(request: UpdateTemplateRequest): Promise<UpdateTemplateResponse> {
    const existing = await this.templateRepository.findById(request.templateId, request.tenantId);
    if (!existing || existing.isDeleted()) throw new NotFoundError('Template not found');
    const updated = await this.templateRepository.update(
      request.templateId,
      request.tenantId,
      { name: request.name, schemaJson: request.schemaJson }
    );
    return {
      id: updated.id,
      tenantId: updated.tenantId,
      name: updated.name,
      version: updated.version,
      schemaJson: updated.schemaJson,
      llmPrompt: updated.llmPrompt,
      llmFinetunedModel: updated.llmFinetunedModel,
      createdAt: updated.createdAt,
    };
  }
}
