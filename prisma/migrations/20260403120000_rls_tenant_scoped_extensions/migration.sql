-- RLS for tenant-scoped tables added after the initial RLS rollout (fix_rls_bypass).
-- Fail-closed: tenant_id must match session app.tenant_id (same pattern as existing policies).

-- ─── diet_plans ─────────────────────────────────────────────────────────────
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS diet_plans_tenant ON diet_plans;
CREATE POLICY diet_plans_tenant ON diet_plans
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── diet_entries ───────────────────────────────────────────────────────────
ALTER TABLE diet_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS diet_entries_tenant ON diet_entries;
CREATE POLICY diet_entries_tenant ON diet_entries
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── alerts ─────────────────────────────────────────────────────────────────
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS alerts_tenant ON alerts;
CREATE POLICY alerts_tenant ON alerts
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── patient_notifications ──────────────────────────────────────────────────
ALTER TABLE patient_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS patient_notifications_tenant ON patient_notifications;
CREATE POLICY patient_notifications_tenant ON patient_notifications
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── exercises ──────────────────────────────────────────────────────────────
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exercises_tenant ON exercises;
CREATE POLICY exercises_tenant ON exercises
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── ai_usage_metrics ─────────────────────────────────────────────────────
ALTER TABLE ai_usage_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_usage_metrics_tenant ON ai_usage_metrics;
CREATE POLICY ai_usage_metrics_tenant ON ai_usage_metrics
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── ai_cost_alerts ─────────────────────────────────────────────────────────
ALTER TABLE ai_cost_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_cost_alerts_tenant ON ai_cost_alerts;
CREATE POLICY ai_cost_alerts_tenant ON ai_cost_alerts
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- ─── refresh_tokens ─────────────────────────────────────────────────────────
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS refresh_tokens_tenant ON refresh_tokens;
CREATE POLICY refresh_tokens_tenant ON refresh_tokens
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);
