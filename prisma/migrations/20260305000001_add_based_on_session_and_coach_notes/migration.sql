-- AlterTable
ALTER TABLE "patient_goals" ADD COLUMN "based_on_session_id" TEXT;

-- AlterTable
ALTER TABLE "training_executions" ADD COLUMN "coach_notes" TEXT;

-- CreateIndex
CREATE INDEX "patient_goals_based_on_session_id_idx" ON "patient_goals"("based_on_session_id");

-- AddForeignKey
ALTER TABLE "patient_goals" ADD CONSTRAINT "patient_goals_based_on_session_id_fkey" FOREIGN KEY ("based_on_session_id") REFERENCES "anamnesis_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
