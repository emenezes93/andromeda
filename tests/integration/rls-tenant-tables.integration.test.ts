/**
 * Contract: every public table with column tenant_id must have row-level security enabled.
 * Prevents new migrations from adding multi-tenant data without DB-enforced isolation.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('RLS: tenant_id tables must enable row security', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('no public table with tenant_id has RLS disabled', async () => {
    const rows = await app.prisma.$queryRaw<Array<{ relname: string }>>`
      SELECT c.relname::text AS relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relrowsecurity = false
        AND EXISTS (
          SELECT 1
          FROM pg_attribute a
          WHERE a.attrelid = c.oid
            AND a.attname = 'tenant_id'
            AND NOT a.attisdropped
        )
      ORDER BY c.relname
    `;
    if (rows.length > 0) {
      const names = rows.map((r) => r.relname).join(', ');
      throw new Error(
        `RLS disabled on tenant-scoped tables (add ENABLE ROW LEVEL SECURITY + policy): ${names}`
      );
    }
  });
});
