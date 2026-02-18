-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3),
    "gender" TEXT,
    "cpf" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "profession" TEXT,
    "main_goal" TEXT,
    "main_complaint" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_evolutions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "weight_kg" DOUBLE PRECISION,
    "height_cm" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "waist_cm" DOUBLE PRECISION,
    "hip_cm" DOUBLE PRECISION,
    "waist_hip_ratio" DOUBLE PRECISION,
    "body_fat_percent" DOUBLE PRECISION,
    "blood_pressure_systolic" INTEGER,
    "blood_pressure_diastolic" INTEGER,
    "heart_rate_bpm" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_evolutions_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "anamnesis_sessions" ADD COLUMN "patient_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "patients_cpf_key" ON "patients"("cpf");

-- CreateIndex
CREATE INDEX "patients_tenant_id_idx" ON "patients"("tenant_id");

-- CreateIndex
CREATE INDEX "patients_tenant_id_full_name_idx" ON "patients"("tenant_id", "full_name");

-- CreateIndex
CREATE INDEX "patient_evolutions_patient_id_recorded_at_idx" ON "patient_evolutions"("patient_id", "recorded_at");

-- CreateIndex
CREATE INDEX "patient_evolutions_tenant_id_idx" ON "patient_evolutions"("tenant_id");

-- CreateIndex
CREATE INDEX "anamnesis_sessions_patient_id_idx" ON "anamnesis_sessions"("patient_id");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_evolutions" ADD CONSTRAINT "patient_evolutions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_evolutions" ADD CONSTRAINT "patient_evolutions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamnesis_sessions" ADD CONSTRAINT "anamnesis_sessions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS for patients and patient_evolutions
ALTER TABLE "patients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "patient_evolutions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients_tenant_isolation" ON "patients"
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');

CREATE POLICY "patient_evolutions_tenant_isolation" ON "patient_evolutions"
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text OR current_setting('app.tenant_id', true) = '');
