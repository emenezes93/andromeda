-- AlterTable: Patient - termo de consentimento LGPD
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "consent_version" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "consent_accepted_at" TIMESTAMP(3);

-- AlterTable: AnamnesisSession - assinatura eletrônica
ALTER TABLE "anamnesis_sessions" ADD COLUMN IF NOT EXISTS "signature_name" TEXT;
ALTER TABLE "anamnesis_sessions" ADD COLUMN IF NOT EXISTS "signature_agreed_at" TIMESTAMP(3);
