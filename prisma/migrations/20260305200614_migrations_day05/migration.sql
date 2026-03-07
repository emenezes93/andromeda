-- AlterTable: progress_photos.file_extension type (if needed)
-- Not creating patients_tenant_id_email_key: already exists from migration 20260220000002_patient_email_unique_per_tenant (partial unique WHERE email IS NOT NULL)
ALTER TABLE "progress_photos" ALTER COLUMN "file_extension" SET DATA TYPE TEXT;
