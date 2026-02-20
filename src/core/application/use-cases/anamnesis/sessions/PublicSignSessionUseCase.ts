import type { ISessionRepository } from '@ports/repositories/ISessionRepository.js';
import { ConflictError, NotFoundError } from '@shared/errors/index.js';

export interface PublicSignSessionRequest {
  token: string;
  signerName: string;
  /** Optional: set tenant context before DB writes (e.g. for RLS in public flow) */
  setTenantId?: (tenantId: string) => void | Promise<void>;
}

export interface PublicSignSessionResponse {
  ok: boolean;
}

export class PublicSignSessionUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(request: PublicSignSessionRequest): Promise<PublicSignSessionResponse> {
    const session = await this.sessionRepository.findByPublicToken(request.token);
    if (!session || session.isDeleted()) {
      throw new NotFoundError('Invalid link or session not found');
    }
    if (session.signatureAgreedAt != null) {
      throw new ConflictError('Session already signed');
    }
    if (request.setTenantId) {
      const r = request.setTenantId(session.tenantId);
      if (r instanceof Promise) await r;
    }
    await this.sessionRepository.updateSignature(
      session.id,
      session.tenantId,
      request.signerName,
      new Date()
    );
    return { ok: true };
  }
}
