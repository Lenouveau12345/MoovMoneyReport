-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "transactionInitiatedTime" DATETIME NOT NULL,
    "frmsisdn" TEXT NOT NULL,
    "tomsisdn" TEXT NOT NULL,
    "frProfile" TEXT NOT NULL,
    "toProfile" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "originalAmount" REAL NOT NULL,
    "fee" REAL NOT NULL,
    "commissionAll" REAL NOT NULL,
    "merchantsOnlineCashIn" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transactionId_key" ON "transactions"("transactionId");
