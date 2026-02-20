-- Migration: fix_rls_bypass
-- Removes the "OR current_setting('app.tenant_id', true) = ''" bypass clause from all
-- RLS policies. Previously, any request that called clearTenantId() (which set the var
-- to '') or any request where setTenantId() was skipped could read ALL rows across ALL
-- tenants. This migration re-creates all policies in fail-closed mode: when tenant_id
-- is not set (or is '__none__'), no rows are returned.

-- ─── tenants ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenants_tenant_isolation ON tenants;
CREATE POLICY tenants_tenant_isolation ON tenants
  FOR ALL USING (id = current_setting('app.tenant_id', true)::text);

-- ─── memberships ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS memberships_tenant_isolation ON memberships;
CREATE POLICY memberships_tenant_isolation ON memberships
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── anamnesis_templates ────────────────────────────────────────────────────
DROP POLICY IF EXISTS anamnesis_templates_tenant ON anamnesis_templates;
CREATE POLICY anamnesis_templates_tenant ON anamnesis_templates
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── anamnesis_sessions ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS anamnesis_sessions_tenant ON anamnesis_sessions;
CREATE POLICY anamnesis_sessions_tenant ON anamnesis_sessions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── anamnesis_answers ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS anamnesis_answers_tenant ON anamnesis_answers;
CREATE POLICY anamnesis_answers_tenant ON anamnesis_answers
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── ai_insights ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS ai_insights_tenant ON ai_insights;
CREATE POLICY ai_insights_tenant ON ai_insights
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── audit_log ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS audit_log_tenant ON audit_log;
CREATE POLICY audit_log_tenant ON audit_log
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── idempotency_keys ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS idempotency_keys_tenant ON idempotency_keys;
CREATE POLICY idempotency_keys_tenant ON idempotency_keys
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── patients ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS patients_tenant_isolation ON patients;
CREATE POLICY patients_tenant_isolation ON patients
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── patient_evolutions ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS patient_evolutions_tenant_isolation ON patient_evolutions;
CREATE POLICY patient_evolutions_tenant_isolation ON patient_evolutions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── scheduled_questionnaires ───────────────────────────────────────────────
DROP POLICY IF EXISTS scheduled_questionnaires_tenant ON scheduled_questionnaires;
CREATE POLICY scheduled_questionnaires_tenant ON scheduled_questionnaires
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── patient_goals ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS patient_goals_tenant ON patient_goals;
CREATE POLICY patient_goals_tenant ON patient_goals
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── training_plans ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS training_plans_tenant_isolation ON training_plans;
CREATE POLICY training_plans_tenant_isolation ON training_plans
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── training_executions ────────────────────────────────────────────────────
DROP POLICY IF EXISTS training_executions_tenant_isolation ON training_executions;
CREATE POLICY training_executions_tenant_isolation ON training_executions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── progress_photos ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS progress_photos_tenant_isolation ON progress_photos;
CREATE POLICY progress_photos_tenant_isolation ON progress_photos
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);
