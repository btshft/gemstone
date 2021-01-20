-- AlterTable
ALTER TABLE "Saga" ADD COLUMN     "activityId" TEXT;

-- CreateIndex
CREATE INDEX "Saga.initiatorId_activityId_index" ON "Saga"("initiatorId", "activityId");

-- CreateIndex
CREATE INDEX "ViewHistory.storyKey_igUserId_index" ON "ViewHistory"("storyKey", "igUserId");
