-- Fase 9: Planos de treino, histórico de treinos executados, fotos de progresso

-- 1. Planos de treino (vinculados ao paciente)
CREATE TABLE training_plans (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  plan_json JSONB NOT NULL, -- estrutura: dias da semana, exercícios, séries, reps, etc.
  start_date DATE NOT NULL,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_training_plans_tenant ON training_plans(tenant_id);
CREATE INDEX idx_training_plans_patient ON training_plans(patient_id);
CREATE INDEX idx_training_plans_patient_active ON training_plans(patient_id, active) WHERE deleted_at IS NULL;

-- 2. Histórico de treinos executados
CREATE TABLE training_executions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  training_plan_id TEXT REFERENCES training_plans(id) ON DELETE SET NULL,
  executed_at TIMESTAMP NOT NULL,
  duration_minutes INT,
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_training_executions_tenant ON training_executions(tenant_id);
CREATE INDEX idx_training_executions_patient ON training_executions(patient_id);
CREATE INDEX idx_training_executions_plan ON training_executions(training_plan_id);
CREATE INDEX idx_training_executions_executed ON training_executions(patient_id, executed_at DESC);

-- 3. Fotos de progresso (URL após upload externo ou path interno)
CREATE TABLE progress_photos (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  taken_at DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_progress_photos_tenant ON progress_photos(tenant_id);
CREATE INDEX idx_progress_photos_patient ON progress_photos(patient_id);
CREATE INDEX idx_progress_photos_taken ON progress_photos(patient_id, taken_at DESC) WHERE deleted_at IS NULL;
