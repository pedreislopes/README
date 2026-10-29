-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoreImport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREVIA',
    "rows" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" DATETIME,
    CONSTRAINT "StoreImport_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdRotation" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "round" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "baseUnit" TEXT NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '',
    "brandMatters" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Product" ("baseUnit", "category", "description", "id", "keywords", "name") SELECT "baseUnit", "category", "description", "id", "keywords", "name" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_tokenHash_key" ON "PasswordReset"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "StoreImport_storeId_createdAt_idx" ON "StoreImport"("storeId", "createdAt");


-- Dados: categoria renomeada e regiões que não são regiões administrativas oficiais
UPDATE "Product" SET "category" = 'Aço para estrutura' WHERE "category" = 'Ferragens e aço';
UPDATE "Store" SET "region" = 'Plano Piloto' WHERE "region" IN ('Asa Norte', 'Asa Sul');
