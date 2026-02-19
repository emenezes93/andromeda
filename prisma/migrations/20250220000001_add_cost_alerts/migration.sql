-- Add cost alert configuration to tenants
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "ai_cost_limit_usd" DOUBLE PRECISION;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "ai_cost_alert_threshold" DOUBLE PRECISION; -- percentage (0-100) of limit to trigger alert
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "ai_cost_alert_sent_at" TIMESTAMP(3);

-- Create table for cost alerts history
CREATE TABLE IF NOT EXISTS "ai_cost_alerts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "current_cost_usd" DOUBLE PRECISION NOT NULL,
    "limit_usd" DOUBLE PRECISION NOT NULL,
    "threshold_percent" DOUBLE PRECISION NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_cost_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_cost_alerts_tenant_id_idx" ON "ai_cost_alerts"("tenant_id");
CREATE INDEX IF NOT EXISTS "ai_cost_alerts_sent_at_idx" ON "ai_cost_alerts"("sent_at");

ALTER TABLE "ai_cost_alerts" ADD CONSTRAINT "ai_cost_alerts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
