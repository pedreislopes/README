-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "specTemplate" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "catalogItemId" TEXT;

-- AlterTable
ALTER TABLE "MaterialSuggestion" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "catalogItemId" TEXT,
ADD COLUMN     "ean" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'MATERIAL',
ADD COLUMN     "model" TEXT,
ADD COLUMN     "typeProductId" TEXT;

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "ean" TEXT,
    "packageLabel" TEXT NOT NULL,
    "baseQuantity" DOUBLE PRECISION NOT NULL,
    "specs" TEXT NOT NULL DEFAULT '{}',
    "photoId" TEXT,
    "photoSource" TEXT,
    "photoAuthorization" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "large" BYTEA NOT NULL,
    "thumb" BYTEA NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoSubmission" (
    "id" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "authorization" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "PhotoSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogImport" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREVIA',
    "rows" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "CatalogImport_pkey" PRIMARY KEY ("id")
);

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

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoSubmission" ADD CONSTRAINT "PhotoSubmission_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoSubmission" ADD CONSTRAINT "PhotoSubmission_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoSubmission" ADD CONSTRAINT "PhotoSubmission_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

