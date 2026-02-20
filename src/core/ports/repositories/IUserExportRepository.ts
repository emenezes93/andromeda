/**
 * GDPR-style export DTO for a user (no secrets, no password hashes).
 */
export interface UserExportDto {
  exportedAt: string; // ISO timestamp
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
    twoFactorEnabled: boolean;
  };
  memberships: Array<{
    tenantId: string;
    role: string;
    active: boolean;
    createdAt: string;
  }>;
  auditLogs: Array<{
    tenantId: string;
    action: string;
    entity: string;
    entityId: string | null;
    metadataJson: unknown;
    createdAt: string;
  }>;
  refreshTokensSummary: {
    total: number;
    active: number;
    revoked: number;
  };
}

/**
 * Port: User data export for GDPR (right of access).
 * Returns all personal data associated with the user, excluding secrets.
 */
export interface IUserExportRepository {
  getExportData(userId: string): Promise<UserExportDto | null>;
}
