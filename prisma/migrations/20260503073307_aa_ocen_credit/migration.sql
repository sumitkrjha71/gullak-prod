-- CreateTable
CREATE TABLE "AAConsent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fipId" TEXT NOT NULL,
    "consentHandle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "fetchedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AAConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoanProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minAmountPaise" BIGINT NOT NULL,
    "maxAmountPaise" BIGINT NOT NULL,
    "minTenureDays" INTEGER NOT NULL,
    "maxTenureDays" INTEGER NOT NULL,
    "baseRatePctBps" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LoanOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "principalPaise" BIGINT NOT NULL,
    "tenureDays" INTEGER NOT NULL,
    "interestPctBps" INTEGER NOT NULL,
    "emiPaise" BIGINT NOT NULL,
    "lenderName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRE_APPROVED',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoanOffer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoanApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "disbursedAt" DATETIME,
    "idempotencyKey" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoanApplication_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "LoanOffer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LoanApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "ageRange" TEXT,
    "incomeRange" TEXT,
    "state" TEXT,
    "salaryDay" INTEGER,
    "isSalaried" BOOLEAN NOT NULL DEFAULT false,
    "lifecycleState" TEXT NOT NULL DEFAULT 'NEW',
    "kycCompleted" BOOLEAN NOT NULL DEFAULT false,
    "aaConsentLinkedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("ageRange", "createdAt", "id", "incomeRange", "isSalaried", "lifecycleState", "locale", "name", "phone", "salaryDay", "state", "updatedAt") SELECT "ageRange", "createdAt", "id", "incomeRange", "isSalaried", "lifecycleState", "locale", "name", "phone", "salaryDay", "state", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AAConsent_consentHandle_key" ON "AAConsent"("consentHandle");

-- CreateIndex
CREATE INDEX "AAConsent_userId_status_idx" ON "AAConsent"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LoanProduct_type_key" ON "LoanProduct"("type");

-- CreateIndex
CREATE INDEX "LoanOffer_userId_status_idx" ON "LoanOffer"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LoanApplication_idempotencyKey_key" ON "LoanApplication"("idempotencyKey");

-- CreateIndex
CREATE INDEX "LoanApplication_userId_createdAt_idx" ON "LoanApplication"("userId", "createdAt");
