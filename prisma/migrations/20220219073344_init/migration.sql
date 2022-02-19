-- CreateTable
CREATE TABLE "Site" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Walker" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siteId" INTEGER,
    "name" TEXT NOT NULL,
    "urlPattern" TEXT NOT NULL,
    "processor" TEXT NOT NULL,
    "urlFilter" TEXT,
    "queryFilter" TEXT,
    CONSTRAINT "Walker_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_key_key" ON "Site"("key");
