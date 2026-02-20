/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,cpf]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex (idempotent: may already have been dropped by 20250220110000)
DROP INDEX IF EXISTS "patients_cpf_key";

-- CreateIndex (idempotent: 20250220110000 may have already created this)
CREATE UNIQUE INDEX IF NOT EXISTS "patients_tenant_id_cpf_key" ON "patients"("tenant_id", "cpf");
