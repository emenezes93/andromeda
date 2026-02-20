/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,cpf]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex (idempotent: index may already exist from 20260219224335 or 20250220110000)
CREATE UNIQUE INDEX IF NOT EXISTS "patients_tenant_id_cpf_key" ON "patients"("tenant_id", "cpf");
