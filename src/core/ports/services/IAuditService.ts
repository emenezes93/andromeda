/**
 * Port: Audit Service Interface
 * Abstracts audit logging
 */
export interface IAuditService {
  log(
    tenantId: string,
    action: string,
    entity: string,
    entityId: string | null,
    actorUserId: string | null,
    metadata?: Record<string, unknown>
  ): Promise<void>;
}
