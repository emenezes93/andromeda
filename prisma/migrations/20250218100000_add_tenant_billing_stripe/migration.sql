-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "stripe_customer_id" TEXT,
ADD COLUMN "stripe_subscription_id" TEXT,
ADD COLUMN "subscription_status" TEXT,
ADD COLUMN "current_period_end" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_stripe_customer_id_key" ON "tenants"("stripe_customer_id");
