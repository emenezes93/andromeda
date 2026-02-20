import type { ITemplateRepository } from '@ports/repositories/ITemplateRepository.js';
import { BadRequestError } from '@shared/errors/index.js';

export interface CreateTemplateRequest {
  tenantId: string;
  name: string;
  schemaJson: unknown;
}

export interface CreateTemplateResponse {
  id: string;
  tenantId: string;
  name: string;
  version: number;
  schemaJson: unknown;
  llmPrompt: string | null;
  llmFinetunedModel: string | null;
  createdAt: Date;
}

function hasQuestionsArray(schemaJson: unknown): boolean {
  if (!schemaJson || typeof schemaJson !== 'object') return false;
  const obj = schemaJson as Record<string, unknown>;
  return Array.isArray(obj.questions);
}

export class CreateTemplateUseCase {
  constructor(private readonly templateRepository: ITemplateRepository) {}

  async execute(request: CreateTemplateRequest): Promise<CreateTemplateResponse> {
    if (!hasQuestionsArray(request.schemaJson)) {
      throw new BadRequestError('schemaJson must contain a questions array');
    }
    const template = await this.templateRepository.create({
      tenantId: request.tenantId,
      name: request.name,
      schemaJson: request.schemaJson,
    });
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
