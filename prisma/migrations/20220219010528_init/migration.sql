-- CreateTable
CREATE TABLE "Site" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_key_key" ON "Site"("key");
