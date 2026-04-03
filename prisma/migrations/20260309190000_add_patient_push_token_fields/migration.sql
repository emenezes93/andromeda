-- Add push token fields for patient mobile notifications
ALTER TABLE "patients"
  ADD COLUMN IF NOT EXISTS "push_token" TEXT,
  ADD COLUMN IF NOT EXISTS "push_platform" TEXT;

CREATE INDEX IF NOT EXISTS "patients_push_token_idx" ON "patients"("push_token");
