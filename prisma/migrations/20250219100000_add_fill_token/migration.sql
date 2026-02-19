-- AlterTable: AnamnesisSession - link público para paciente preencher
ALTER TABLE "anamnesis_sessions" ADD COLUMN IF NOT EXISTS "fill_token" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "anamnesis_sessions_fill_token_key" ON "anamnesis_sessions"("fill_token");
