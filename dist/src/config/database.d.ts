import type { PrismaClient } from '@prisma/client';
/**
 * Database Configuration
 * Centralizes Prisma client configuration and lifecycle
 */
export declare function createPrismaClient(logLevel?: 'trace' | 'info' | 'warn' | 'error'): PrismaClient;
export declare function setupTenantContext(prisma: PrismaClient, tenantId: string): Promise<void>;
export declare function clearTenantContext(prisma: PrismaClient): Promise<void>;
//# sourceMappingURL=database.d.ts.map