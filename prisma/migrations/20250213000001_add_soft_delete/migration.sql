-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "anamnesis_templates" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "anamnesis_sessions" ADD COLUMN "deleted_at" TIMESTAMP(3);
