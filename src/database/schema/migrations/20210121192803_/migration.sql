-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hash" TEXT,
    "type" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "parameters" JSONB,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Favorite.hash_index" ON "Favorite"("hash");

-- AddForeignKey
ALTER TABLE "Favorite" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
