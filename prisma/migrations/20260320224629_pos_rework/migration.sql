-- CreateTable
CREATE TABLE "CashRegisterSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warehouseId" TEXT NOT NULL,
    "warehouseName" TEXT NOT NULL,
    "openingBalance" REAL NOT NULL,
    "closedAt" DATETIME,
    "openedBy" TEXT NOT NULL,
    "openedByName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashRegisterSession_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CashRegisterSession_openedBy_fkey" FOREIGN KEY ("openedBy") REFERENCES "User" ("username") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warehouseId" TEXT NOT NULL,
    "warehouseName" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "total" REAL NOT NULL,
    "cashReceived" REAL NOT NULL,
    "change" REAL NOT NULL,
    "saleType" TEXT NOT NULL DEFAULT 'normal',
    "authorizedBy" TEXT,
    "authorizedByName" TEXT,
    "cashRegisterSessionId" TEXT,
    "performedBy" TEXT NOT NULL,
    "performedByName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User" ("username") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_cashRegisterSessionId_fkey" FOREIGN KEY ("cashRegisterSessionId") REFERENCES "CashRegisterSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("cashReceived", "change", "createdAt", "id", "itemCount", "items", "performedBy", "performedByName", "total", "warehouseId", "warehouseName") SELECT "cashReceived", "change", "createdAt", "id", "itemCount", "items", "performedBy", "performedByName", "total", "warehouseId", "warehouseName" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
