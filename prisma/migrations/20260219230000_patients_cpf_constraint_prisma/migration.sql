-- Garantir que existe constraint única (tenant_id, cpf) como o Prisma espera,
-- eliminando o drift que faz o Prisma pedir nova migration a cada migrate dev.
-- Remove o índice único existente (pode ser partial ou full) e recria como CONSTRAINT.
DROP INDEX IF EXISTS "patients_tenant_id_cpf_key";
ALTER TABLE "patients" ADD CONSTRAINT "patients_tenant_id_cpf_key" UNIQUE ("tenant_id", "cpf");
