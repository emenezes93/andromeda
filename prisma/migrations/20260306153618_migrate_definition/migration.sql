/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,email]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex (skip if already exists - see 20260220000002_patient_email_unique_per_tenant)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'patients_tenant_id_email_key') THEN
    CREATE UNIQUE INDEX "patients_tenant_id_email_key" ON "patients"("tenant_id", "email");
  END IF;
END $$;
