-- Row-Level Security (RLS) for multi-tenant isolation
-- This script runs on first DB init (docker-entrypoint-initdb.d).
-- Application must SET app.tenant_id at connection/transaction start for RLS to filter.
-- For tables added in later migrations, RLS is applied in those migrations; this file
-- documents the full set and can be used to init a new DB that already has all tables.

-- Session variable used by RLS (set by app per request)
-- SELECT set_config('app.tenant_id', 'tenant-cuid-here', true);
-- When clearing (end of request): set to '__none__' (impossible CUID) — never to '' which bypasses all policies.

-- Core tables (from initial migrations)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Tenants: only the current tenant's row is visible
CREATE POLICY tenants_tenant_isolation ON tenants
  FOR ALL USING (id = current_setting('app.tenant_id', true)::text);

-- Users: no tenant_id column — users are shared across tenants via memberships.
-- App-layer authorization (JWT + membership checks) enforces access control.
-- SECURITY NOTE: any DB-level query can read all users; SQL injection mitigations and
-- parameterized queries in Prisma are the primary protection layer for this table.
CREATE POLICY users_all ON users FOR ALL USING (true);

CREATE POLICY memberships_tenant_isolation ON memberships
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

CREATE POLICY anamnesis_templates_tenant ON anamnesis_templates
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

CREATE POLICY anamnesis_sessions_tenant ON anamnesis_sessions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

CREATE POLICY anamnesis_answers_tenant ON anamnesis_answers
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

CREATE POLICY ai_insights_tenant ON ai_insights
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

CREATE POLICY audit_log_tenant ON audit_log
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

CREATE POLICY idempotency_keys_tenant ON idempotency_keys
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- Tables with tenant_id added in later migrations (patients, evolutions, scheduled_questionnaires, patient_goals, training_plans, training_executions, progress_photos)
-- are enabled and policed in their respective migrations. See:
-- 20250218000000_add_patients_and_evolution (patients, patient_evolutions)
-- 20250219000000_fase8_portal_aluno_metas (scheduled_questionnaires, patient_goals)
-- 20250220100000_rls_fase9_and_user_lock (training_plans, training_executions, progress_photos)
