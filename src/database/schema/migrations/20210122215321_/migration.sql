-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('Followers');

-- CreateTable
CREATE TABLE "IgUser" (
    "id" TEXT NOT NULL,
    "pk" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profilePicUrl" TEXT,
    "fullname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" TEXT NOT NULL,
    "type" "InsightType" NOT NULL,
    "initiatorId" TEXT,
    "expiration" TIMESTAMP(3),
    "content" JSONB NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightAccessToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "expiration" TIMESTAMP(3),

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_follows" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "IgUser.pk_unique" ON "IgUser"("pk");

-- CreateIndex
CREATE INDEX "Insight.groupId_expiration_initiatorId_index" ON "Insight"("groupId", "expiration", "initiatorId");

-- CreateIndex
CREATE UNIQUE INDEX "InsightAccessToken.token_unique" ON "InsightAccessToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "_follows_AB_unique" ON "_follows"("A", "B");

-- CreateIndex
CREATE INDEX "_follows_B_index" ON "_follows"("B");

-- AddForeignKey
ALTER TABLE "Insight" ADD FOREIGN KEY("initiatorId")REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightAccessToken" ADD FOREIGN KEY("insightId")REFERENCES "Insight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_follows" ADD FOREIGN KEY("A")REFERENCES "IgUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_follows" ADD FOREIGN KEY("B")REFERENCES "IgUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
