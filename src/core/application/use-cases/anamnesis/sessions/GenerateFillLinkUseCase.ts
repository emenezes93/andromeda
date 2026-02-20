import type { ISessionRepository } from '@ports/repositories/ISessionRepository.js';
import { ConflictError, NotFoundError } from '@shared/errors/index.js';
import crypto from 'node:crypto';

export interface GenerateFillLinkRequest {
  sessionId: string;
  tenantId: string;
  baseUrl?: string;
}

export interface GenerateFillLinkResponse {
  fillToken: string;
  fillUrl: string;
}

export class GenerateFillLinkUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(request: GenerateFillLinkRequest): Promise<GenerateFillLinkResponse> {
    const session = await this.sessionRepository.findById(request.sessionId, request.tenantId);
    if (!session || session.isDeleted()) throw new NotFoundError('Session not found');
    if (session.status === 'completed') {
      throw new ConflictError('Cannot generate fill link for completed session');
    }
    let fillToken = session.fillToken;
    if (!fillToken) {
      fillToken = crypto.randomBytes(16).toString('hex');
      await this.sessionRepository.setFillToken(
        request.sessionId,
        request.tenantId,
        fillToken
      );
    }
    const baseUrl = (request.baseUrl ?? '').trim().replace(/\/$/, '');
    const fillUrl = baseUrl ? `${baseUrl}/fill/${fillToken}` : `/fill/${fillToken}`;
    return { fillToken, fillUrl };
  }
}
