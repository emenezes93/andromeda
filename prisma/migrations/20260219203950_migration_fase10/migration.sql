-- DropForeignKey
ALTER TABLE "progress_photos" DROP CONSTRAINT "progress_photos_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "progress_photos" DROP CONSTRAINT "progress_photos_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "training_executions" DROP CONSTRAINT "training_executions_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "training_executions" DROP CONSTRAINT "training_executions_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "training_executions" DROP CONSTRAINT "training_executions_training_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "training_plans" DROP CONSTRAINT "training_plans_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "training_plans" DROP CONSTRAINT "training_plans_tenant_id_fkey";

-- AlterTable
ALTER TABLE "progress_photos" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "training_executions" ALTER COLUMN "executed_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "training_plans" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "progress_photos_patient_id_taken_at_idx" ON "progress_photos"("patient_id", "taken_at" DESC);

-- CreateIndex
CREATE INDEX "training_plans_patient_id_active_idx" ON "training_plans"("patient_id", "active");

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_executions" ADD CONSTRAINT "training_executions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_executions" ADD CONSTRAINT "training_executions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_executions" ADD CONSTRAINT "training_executions_training_plan_id_fkey" FOREIGN KEY ("training_plan_id") REFERENCES "training_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_progress_photos_patient" RENAME TO "progress_photos_patient_id_idx";

-- RenameIndex
ALTER INDEX "idx_progress_photos_tenant" RENAME TO "progress_photos_tenant_id_idx";

-- RenameIndex
ALTER INDEX "idx_training_executions_executed" RENAME TO "training_executions_patient_id_executed_at_idx";

-- RenameIndex
ALTER INDEX "idx_training_executions_patient" RENAME TO "training_executions_patient_id_idx";

-- RenameIndex
ALTER INDEX "idx_training_executions_plan" RENAME TO "training_executions_training_plan_id_idx";

-- RenameIndex
ALTER INDEX "idx_training_executions_tenant" RENAME TO "training_executions_tenant_id_idx";

-- RenameIndex
ALTER INDEX "idx_training_plans_patient" RENAME TO "training_plans_patient_id_idx";

-- RenameIndex
ALTER INDEX "idx_training_plans_tenant" RENAME TO "training_plans_tenant_id_idx";
