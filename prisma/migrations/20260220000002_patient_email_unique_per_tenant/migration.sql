-- Migration: patient_email_unique_per_tenant
-- Adds a partial unique index on (tenant_id, email) for the patients table.
-- Uses WHERE email IS NOT NULL so that multiple patients without an email
-- are allowed within the same tenant (same behavior as the CPF constraint).
--
-- Pattern follows: 20250220110000_cpf_unique_per_tenant_audit_append_only

CREATE UNIQUE INDEX IF NOT EXISTS patients_tenant_id_email_key
  ON patients(tenant_id, email)
  WHERE email IS NOT NULL;
