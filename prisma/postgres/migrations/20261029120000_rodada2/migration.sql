-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brandMatters" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreImport" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREVIA',
    "rows" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "StoreImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdRotation" (
    "key" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdRotation_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_tokenHash_key" ON "PasswordReset"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "StoreImport_storeId_createdAt_idx" ON "StoreImport"("storeId", "createdAt");

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreImport" ADD CONSTRAINT "StoreImport_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Dados: categoria renomeada e regiões que não são regiões administrativas oficiais
UPDATE "Product" SET "category" = 'Aço para estrutura' WHERE "category" = 'Ferragens e aço';
UPDATE "Store" SET "region" = 'Plano Piloto' WHERE "region" IN ('Asa Norte', 'Asa Sul');
