-- DropForeignKey
ALTER TABLE "password_history" DROP CONSTRAINT "password_history_user_id_fkey";

-- AlterTable
ALTER TABLE "password_history" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password_changed_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "password_expires_at" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_memberships_active" RENAME TO "memberships_tenant_id_active_idx";

-- RenameIndex
ALTER INDEX "idx_password_history_user_id" RENAME TO "password_history_user_id_created_at_idx";
