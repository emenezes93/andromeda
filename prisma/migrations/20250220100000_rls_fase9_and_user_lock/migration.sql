-- 1. RLS para tabelas da Fase 9 (training_plans, training_executions, progress_photos)
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY training_plans_tenant_isolation ON training_plans
  FOR ALL USING (
    current_setting('app.tenant_id', true) = tenant_id::text
    OR current_setting('app.tenant_id', true) = ''
  );

ALTER TABLE training_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY training_executions_tenant_isolation ON training_executions
  FOR ALL USING (
    current_setting('app.tenant_id', true) = tenant_id::text
    OR current_setting('app.tenant_id', true) = ''
  );

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY progress_photos_tenant_isolation ON progress_photos
  FOR ALL USING (
    current_setting('app.tenant_id', true) = tenant_id::text
    OR current_setting('app.tenant_id', true) = ''
  );

-- 2. User: loginAttempts + lockedUntil (proteção contra brute-force)
ALTER TABLE users ADD COLUMN login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until) WHERE locked_until IS NOT NULL;
