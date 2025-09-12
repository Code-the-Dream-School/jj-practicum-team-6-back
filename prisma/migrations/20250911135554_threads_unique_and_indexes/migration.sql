/*
  Warnings:

  - A unique constraint covering the columns `[item_id,participant_id]` on the table `threads` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "item_comments_item_id_created_at_idx" ON "public"."item_comments"("item_id", "created_at");

-- CreateIndex
CREATE INDEX "items_zip_code_idx" ON "public"."items"("zip_code");

-- CreateIndex
CREATE UNIQUE INDEX "threads_item_id_participant_id_key" ON "public"."threads"("item_id", "participant_id");
