-- AlterTable
ALTER TABLE "Order" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "Order" ADD COLUMN "canceledAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "canceledBy" TEXT;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN "statusChangedAt" DATETIME;
ALTER TABLE "Store" ADD COLUMN "statusReason" TEXT;

-- CreateTable
CREATE TABLE "MaterialSuggestion" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialSuggestion_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");


-- Nome novo do status: lojas "BLOQUEADA" passam a se chamar "SUSPENSA"
UPDATE "Store" SET "status" = 'SUSPENSA' WHERE "status" = 'BLOQUEADA';
