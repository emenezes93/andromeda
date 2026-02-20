import type { AnamnesisSession } from '@domain/entities/AnamnesisSession.js';
import type { PaginationOpts, Paginated } from '@ports/repositories/ITemplateRepository.js';

export interface SessionCreateData {
  tenantId: string;
  templateId: string;
  subjectId?: string | null;
  patientId?: string | null;
}

export interface SessionListOpts extends PaginationOpts {
  patientId?: string;
  templateId?: string;
  status?: string;
}

/** Session list item with template and patient for list API */
export interface SessionListEntry {
  id: string;
  tenantId: string;
  templateId: string;
  subjectId: string | null;
  patientId: string | null;
  status: string;
  fillToken: string | null;
  signatureName: string | null;
  signatureAgreedAt: Date | null;
  createdAt: Date;
  template: { id: string; name: string };
  patient: { id: string; fullName: string } | null;
}

/**
 * Port: Anamnesis Session Repository Interface
 */
export interface ISessionRepository {
  findAll(tenantId: string, opts: SessionListOpts): Promise<Paginated<SessionListEntry>>;
  findById(id: string, tenantId: string, options?: { includeLatestAnswers?: boolean }): Promise<AnamnesisSession | null>;
  findByPublicToken(token: string): Promise<AnamnesisSession | null>;
  create(data: SessionCreateData): Promise<AnamnesisSession>;
  addAnswers(
    sessionId: string,
    tenantId: string,
    answersJson: Record<string, unknown>
  ): Promise<{ id: string; sessionId: string; answersJson: Record<string, unknown>; createdAt: Date }>;
  /** Saves answers and marks session as completed in a single atomic transaction. */
  addAnswersAndComplete(
    sessionId: string,
    tenantId: string,
    answersJson: Record<string, unknown>
  ): Promise<{ id: string; sessionId: string; answersJson: Record<string, unknown>; createdAt: Date }>;
  updateStatus(id: string, tenantId: string, status: AnamnesisSession['status']): Promise<AnamnesisSession>;
  updateSignature(
    id: string,
    tenantId: string,
    signatureName: string,
    signatureAgreedAt: Date
  ): Promise<AnamnesisSession>;
  setFillToken(id: string, tenantId: string, fillToken: string): Promise<AnamnesisSession>;
}
