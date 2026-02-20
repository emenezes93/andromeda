import type { ITemplateRepository } from '@ports/repositories/ITemplateRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface DeleteTemplateRequest {
  templateId: string;
  tenantId: string;
}

export class DeleteTemplateUseCase {
  constructor(private readonly templateRepository: ITemplateRepository) {}

  async execute(request: DeleteTemplateRequest): Promise<void> {
    const template = await this.templateRepository.findById(request.templateId, request.tenantId);
    if (!template || template.isDeleted()) throw new NotFoundError('Template not found');
    await this.templateRepository.delete(request.templateId, request.tenantId);
  }
}
