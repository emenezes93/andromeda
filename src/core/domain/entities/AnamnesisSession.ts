/**
 * Domain Entity: AnamnesisSession
 */
export type SessionStatus = 'in_progress' | 'completed';

export class AnamnesisSession {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly templateId: string,
    public readonly subjectId: string | null,
    public readonly patientId: string | null,
    public readonly status: SessionStatus,
    public readonly fillToken: string | null,
    public readonly signatureName: string | null,
    public readonly signatureAgreedAt: Date | null,
    public readonly createdAt: Date,
    public readonly deletedAt: Date | null = null,
    /** Set when loaded with latest answers (not persisted on entity) */
    public readonly currentAnswersJson: Record<string, unknown> = {}
  ) {}

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  canReceiveAnswer(): boolean {
    return this.status === 'in_progress' && !this.deletedAt;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
