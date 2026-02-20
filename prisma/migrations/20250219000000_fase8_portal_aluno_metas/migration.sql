-- Fase 8: Portal do Aluno, Agendamento e Metas
-- Migration para adicionar userId ao Patient e criar tabelas de agendamento e metas

-- 1. Adicionar userId ao Patient (para vincular paciente a conta de usuário)
ALTER TABLE patients ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_tenant_user ON patients(tenant_id, user_id);

-- 2. Tabela de agendamento de questionários recorrentes
CREATE TABLE scheduled_questionnaires (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES anamnesis_templates(id) ON DELETE RESTRICT,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL, -- 'weekly' | 'biweekly' | 'monthly' | 'quarterly'
  day_of_week INT, -- 0-6 (domingo-sábado) para weekly/biweekly
  day_of_month INT, -- 1-31 para monthly/quarterly
  start_date DATE NOT NULL,
  end_date DATE,
  next_run_at TIMESTAMP,
  last_run_at TIMESTAMP,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_scheduled_questionnaires_tenant ON scheduled_questionnaires(tenant_id);
CREATE INDEX idx_scheduled_questionnaires_patient ON scheduled_questionnaires(patient_id);
CREATE INDEX idx_scheduled_questionnaires_next_run ON scheduled_questionnaires(next_run_at) WHERE active = true AND deleted_at IS NULL;
CREATE INDEX idx_scheduled_questionnaires_active ON scheduled_questionnaires(tenant_id, active, deleted_at) WHERE active = true AND deleted_at IS NULL;

-- 3. Tabela de metas e objetivos
CREATE TABLE patient_goals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'weight_loss' | 'muscle_gain' | 'performance' | 'health' | 'other'
  title TEXT NOT NULL,
  description TEXT,
  current_value NUMERIC,
  target_value NUMERIC NOT NULL,
  unit TEXT NOT NULL, -- 'kg' | 'cm' | '%' | 'bpm' | 'custom'
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  achieved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_patient_goals_tenant ON patient_goals(tenant_id);
CREATE INDEX idx_patient_goals_patient ON patient_goals(patient_id);
CREATE INDEX idx_patient_goals_active ON patient_goals(tenant_id, patient_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_patient_goals_target_date ON patient_goals(target_date) WHERE achieved_at IS NULL AND deleted_at IS NULL;

-- RLS policies para scheduled_questionnaires
ALTER TABLE scheduled_questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY scheduled_questionnaires_tenant_isolation ON scheduled_questionnaires
  FOR ALL
  USING (
    current_setting('app.tenant_id', true) = tenant_id::text
    OR current_setting('app.tenant_id', true) = ''
  );

-- RLS policies para patient_goals
ALTER TABLE patient_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY patient_goals_tenant_isolation ON patient_goals
  FOR ALL
  USING (
    current_setting('app.tenant_id', true) = tenant_id::text
    OR current_setting('app.tenant_id', true) = ''
  );
