/*
  Warnings:

  - You are about to alter the column `current_value` on the `patient_goals` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `DoublePrecision`.
  - You are about to alter the column `target_value` on the `patient_goals` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `DoublePrecision`.

*/
-- DropForeignKey
ALTER TABLE "patient_goals" DROP CONSTRAINT "patient_goals_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "patient_goals" DROP CONSTRAINT "patient_goals_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "patients" DROP CONSTRAINT "patients_user_id_fkey";

-- DropForeignKey
ALTER TABLE "scheduled_questionnaires" DROP CONSTRAINT "scheduled_questionnaires_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "scheduled_questionnaires" DROP CONSTRAINT "scheduled_questionnaires_template_id_fkey";

-- DropForeignKey
ALTER TABLE "scheduled_questionnaires" DROP CONSTRAINT "scheduled_questionnaires_tenant_id_fkey";

-- AlterTable
ALTER TABLE "patient_goals" ALTER COLUMN "current_value" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "target_value" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "achieved_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "scheduled_questionnaires" ALTER COLUMN "next_run_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "last_run_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "patient_goals_tenant_id_patient_id_deleted_at_idx" ON "patient_goals"("tenant_id", "patient_id", "deleted_at");

-- CreateIndex
CREATE INDEX "patient_goals_target_date_idx" ON "patient_goals"("target_date");

-- CreateIndex
CREATE INDEX "scheduled_questionnaires_next_run_at_idx" ON "scheduled_questionnaires"("next_run_at");

-- CreateIndex
CREATE INDEX "scheduled_questionnaires_tenant_id_active_deleted_at_idx" ON "scheduled_questionnaires"("tenant_id", "active", "deleted_at");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_questionnaires" ADD CONSTRAINT "scheduled_questionnaires_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_questionnaires" ADD CONSTRAINT "scheduled_questionnaires_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "anamnesis_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_questionnaires" ADD CONSTRAINT "scheduled_questionnaires_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_goals" ADD CONSTRAINT "patient_goals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_goals" ADD CONSTRAINT "patient_goals_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_patient_goals_patient" RENAME TO "patient_goals_patient_id_idx";

-- RenameIndex
ALTER INDEX "idx_patient_goals_tenant" RENAME TO "patient_goals_tenant_id_idx";

-- RenameIndex
ALTER INDEX "idx_patients_tenant_user" RENAME TO "patients_tenant_id_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_patients_user_id" RENAME TO "patients_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_scheduled_questionnaires_patient" RENAME TO "scheduled_questionnaires_patient_id_idx";

-- RenameIndex
ALTER INDEX "idx_scheduled_questionnaires_tenant" RENAME TO "scheduled_questionnaires_tenant_id_idx";
