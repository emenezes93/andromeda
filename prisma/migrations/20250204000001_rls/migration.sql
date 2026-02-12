-- Enable Row-Level Security on tenant-scoped tables
-- App must SET app.tenant_id at start of each request/transaction for isolation.

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_tenant_isolation ON tenants;
CREATE POLICY tenants_tenant_isolation ON tenants
  FOR ALL USING (id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');

DROP POLICY IF EXISTS memberships_tenant_isolation ON memberships;
CREATE POLICY memberships_tenant_isolation ON memberships
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');

DROP POLICY IF EXISTS anamnesis_templates_tenant ON anamnesis_templates;
CREATE POLICY anamnesis_templates_tenant ON anamnesis_templates
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');

DROP POLICY IF EXISTS anamnesis_sessions_tenant ON anamnesis_sessions;
CREATE POLICY anamnesis_sessions_tenant ON anamnesis_sessions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');

DROP POLICY IF EXISTS anamnesis_answers_tenant ON anamnesis_answers;
CREATE POLICY anamnesis_answers_tenant ON anamnesis_answers
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');

DROP POLICY IF EXISTS ai_insights_tenant ON ai_insights;
CREATE POLICY ai_insights_tenant ON ai_insights
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');

DROP POLICY IF EXISTS audit_log_tenant ON audit_log;
CREATE POLICY audit_log_tenant ON audit_log
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');

DROP POLICY IF EXISTS idempotency_keys_tenant ON idempotency_keys;
CREATE POLICY idempotency_keys_tenant ON idempotency_keys
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');
