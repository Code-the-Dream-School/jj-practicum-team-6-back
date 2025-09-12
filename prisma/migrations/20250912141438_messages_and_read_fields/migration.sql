/*
  Warnings:

  - You are about to drop the column `read_at` on the `messages` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."messages_thread_id_created_at_idx";

-- AlterTable
ALTER TABLE "public"."messages" DROP COLUMN "read_at",
ADD COLUMN     "attachment_url" TEXT;

-- AlterTable
ALTER TABLE "public"."threads" ADD COLUMN     "owner_last_read_at" TIMESTAMP(3),
ADD COLUMN     "owner_last_read_message_id" UUID,
ADD COLUMN     "participant_last_read_at" TIMESTAMP(3),
ADD COLUMN     "participant_last_read_message_id" UUID;

-- CreateIndex
CREATE INDEX "messages_thread_id_created_at_idx" ON "public"."messages"("thread_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "threads_owner_last_read_message_id_idx" ON "public"."threads"("owner_last_read_message_id");

-- CreateIndex
CREATE INDEX "threads_participant_last_read_message_id_idx" ON "public"."threads"("participant_last_read_message_id");
