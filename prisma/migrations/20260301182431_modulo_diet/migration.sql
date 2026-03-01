-- AlterTable
ALTER TABLE "training_executions" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "diet_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "calories_kcal" INTEGER,
    "protein_g" DOUBLE PRECISION,
    "carbs_g" DOUBLE PRECISION,
    "fat_g" DOUBLE PRECISION,
    "water_ml" INTEGER,
    "restrictions" TEXT[],
    "meal_plan_json" JSONB,
    "based_on_session_id" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "diet_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diet_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "diet_plan_id" TEXT,
    "entry_date" DATE NOT NULL,
    "meal_type" TEXT NOT NULL,
    "foods_json" JSONB NOT NULL,
    "total_calories" INTEGER,
    "total_protein_g" DOUBLE PRECISION,
    "total_carbs_g" DOUBLE PRECISION,
    "total_fat_g" DOUBLE PRECISION,
    "water_ml" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "diet_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "diet_plans_tenant_id_idx" ON "diet_plans"("tenant_id");

-- CreateIndex
CREATE INDEX "diet_plans_patient_id_idx" ON "diet_plans"("patient_id");

-- CreateIndex
CREATE INDEX "diet_plans_patient_id_active_idx" ON "diet_plans"("patient_id", "active");

-- CreateIndex
CREATE INDEX "diet_entries_tenant_id_idx" ON "diet_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "diet_entries_patient_id_idx" ON "diet_entries"("patient_id");

-- CreateIndex
CREATE INDEX "diet_entries_patient_id_entry_date_idx" ON "diet_entries"("patient_id", "entry_date" DESC);

-- CreateIndex
CREATE INDEX "diet_entries_diet_plan_id_idx" ON "diet_entries"("diet_plan_id");

-- AddForeignKey
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_entries" ADD CONSTRAINT "diet_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_entries" ADD CONSTRAINT "diet_entries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_entries" ADD CONSTRAINT "diet_entries_diet_plan_id_fkey" FOREIGN KEY ("diet_plan_id") REFERENCES "diet_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
