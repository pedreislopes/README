-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "ean" TEXT,
    "packageLabel" TEXT NOT NULL,
    "baseQuantity" REAL NOT NULL,
    "specs" TEXT NOT NULL DEFAULT '{}',
    "photoId" TEXT,
    "photoSource" TEXT,
    "photoAuthorization" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CatalogItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CatalogItem_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "large" BLOB NOT NULL,
    "thumb" BLOB NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PhotoSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "catalogItemId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "authorization" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "reviewNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    CONSTRAINT "PhotoSubmission_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PhotoSubmission_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PhotoSubmission_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogImport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREVIA',
    "rows" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MaterialSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "baseUnit" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "reviewNote" TEXT,
    "reviewedAt" DATETIME,
    "productId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'MATERIAL',
    "typeProductId" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "ean" TEXT,
    "catalogItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialSuggestion_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MaterialSuggestion" ("baseUnit", "category", "createdAt", "id", "name", "note", "productId", "reviewNote", "reviewedAt", "status", "storeId") SELECT "baseUnit", "category", "createdAt", "id", "name", "note", "productId", "reviewNote", "reviewedAt", "status", "storeId" FROM "MaterialSuggestion";
DROP TABLE "MaterialSuggestion";
ALTER TABLE "new_MaterialSuggestion" RENAME TO "MaterialSuggestion";
CREATE TABLE "new_Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brand" TEXT,
    "packageLabel" TEXT NOT NULL,
    "baseQuantity" REAL NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "tiersForCpf" BOOLEAN NOT NULL DEFAULT false,
    "quantityStep" REAL NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "catalogItemId" TEXT,
    CONSTRAINT "Offer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Offer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offer_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Offer" ("active", "baseQuantity", "brand", "id", "packageLabel", "priceCents", "productId", "quantityStep", "storeId", "tiersForCpf") SELECT "active", "baseQuantity", "brand", "id", "packageLabel", "priceCents", "productId", "quantityStep", "storeId", "tiersForCpf" FROM "Offer";
DROP TABLE "Offer";
ALTER TABLE "new_Offer" RENAME TO "Offer";
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "baseUnit" TEXT NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '',
    "brandMatters" BOOLEAN NOT NULL DEFAULT false,
    "specTemplate" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Product" ("baseUnit", "brandMatters", "category", "description", "id", "keywords", "name") SELECT "baseUnit", "brandMatters", "category", "description", "id", "keywords", "name" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_ean_key" ON "CatalogItem"("ean");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_photoId_key" ON "CatalogItem"("photoId");

-- CreateIndex
CREATE INDEX "CatalogItem_productId_idx" ON "CatalogItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoSubmission_photoId_key" ON "PhotoSubmission"("photoId");

-- CreateIndex
CREATE INDEX "PhotoSubmission_status_idx" ON "PhotoSubmission"("status");

-- CreateIndex
CREATE INDEX "CatalogImport_createdAt_idx" ON "CatalogImport"("createdAt");

