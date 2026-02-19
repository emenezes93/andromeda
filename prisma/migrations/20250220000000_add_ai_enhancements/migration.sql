-- Add answersHash to ai_insights for similarity caching
ALTER TABLE "ai_insights" ADD COLUMN IF NOT EXISTS "answers_hash" TEXT;
CREATE INDEX IF NOT EXISTS "ai_insights_answers_hash_idx" ON "ai_insights"("answers_hash");

-- Add llmPrompt to templates for custom prompts
ALTER TABLE "anamnesis_templates" ADD COLUMN IF NOT EXISTS "llm_prompt" TEXT;

-- Create table for AI usage metrics (tokens, costs per tenant)
CREATE TABLE IF NOT EXISTS "ai_usage_metrics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_metrics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_usage_metrics_tenant_id_idx" ON "ai_usage_metrics"("tenant_id");
CREATE INDEX IF NOT EXISTS "ai_usage_metrics_session_id_idx" ON "ai_usage_metrics"("session_id");
CREATE INDEX IF NOT EXISTS "ai_usage_metrics_created_at_idx" ON "ai_usage_metrics"("created_at");

ALTER TABLE "ai_usage_metrics" ADD CONSTRAINT "ai_usage_metrics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_usage_metrics" ADD CONSTRAINT "ai_usage_metrics_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "anamnesis_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
