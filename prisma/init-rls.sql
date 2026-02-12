-- Row-Level Security (RLS) for multi-tenant isolation
-- This script runs on first DB init (docker-entrypoint-initdb.d).
-- Application must SET app.tenant_id at connection/transaction start for RLS to filter.

-- Session variable used by RLS (set by app per request)
-- SELECT set_config('app.tenant_id', 'tenant-cuid-here', true);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Tenants: allow read/insert when tenant_id matches (service role can bypass with no set_config)
CREATE POLICY tenants_tenant_isolation ON tenants
  FOR ALL USING (id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');

-- Users: no tenant_id column; RLS allows all for users table (access controlled via membership)
-- For simplicity we allow all for users; membership is tenant-scoped.
CREATE POLICY users_all ON users FOR ALL USING (true);

-- Memberships: restrict by tenant_id
CREATE POLICY memberships_tenant_isolation ON memberships
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');

CREATE POLICY anamnesis_templates_tenant ON anamnesis_templates
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');

CREATE POLICY anamnesis_sessions_tenant ON anamnesis_sessions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');

CREATE POLICY anamnesis_answers_tenant ON anamnesis_answers
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');

CREATE POLICY ai_insights_tenant ON ai_insights
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');

CREATE POLICY audit_log_tenant ON audit_log
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');

CREATE POLICY idempotency_keys_tenant ON idempotency_keys
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');
