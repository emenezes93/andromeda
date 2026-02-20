/**
 * Port: read-only audit log query (list with filters)
 */
export interface AuditLogEntry {
  id: string;
  tenantId: string;
  actorUserId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: Date;
}

export interface AuditListOpts {
  page: number;
  limit: number;
  action?: string;
  entity?: string;
  entityId?: string;
  userId?: string;
  from?: string;
  to?: string;
}

export interface AuditListResult {
  data: AuditLogEntry[];
  total: number;
}

export interface IAuditQueryRepository {
  list(tenantId: string, opts: AuditListOpts): Promise<AuditListResult>;
}

