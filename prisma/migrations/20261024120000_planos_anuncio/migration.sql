-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "statusReason" TEXT,
    "statusChangedAt" DATETIME,
    "commissionPercent" REAL NOT NULL DEFAULT 10,
    "adPlan" TEXT NOT NULL DEFAULT 'NENHUM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- Lojas que já estavam "em destaque" passam para o plano "DESTAQUE"
INSERT INTO "new_Store" ("address", "cnpj", "commissionPercent", "createdAt", "id", "name", "ownerId", "phone", "region", "status", "statusChangedAt", "statusReason", "adPlan") SELECT "address", "cnpj", "commissionPercent", "createdAt", "id", "name", "ownerId", "phone", "region", "status", "statusChangedAt", "statusReason", CASE WHEN "featured" THEN 'DESTAQUE' ELSE 'NENHUM' END FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
CREATE UNIQUE INDEX "Store_ownerId_key" ON "Store"("ownerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

