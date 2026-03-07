-- CreateTable
CREATE TABLE "patient_notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "read_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_notifications_tenant_id_idx" ON "patient_notifications"("tenant_id");

-- CreateIndex
CREATE INDEX "patient_notifications_patient_id_idx" ON "patient_notifications"("patient_id");

-- CreateIndex
CREATE INDEX "patient_notifications_patient_id_read_at_idx" ON "patient_notifications"("patient_id", "read_at");

-- CreateIndex
CREATE INDEX "patient_notifications_tenant_id_patient_id_type_created_at_idx" ON "patient_notifications"("tenant_id", "patient_id", "type", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "patient_notifications" ADD CONSTRAINT "patient_notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_notifications" ADD CONSTRAINT "patient_notifications_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
