-- CreateEnum
CREATE TYPE "PhoneVerificationScene" AS ENUM ('bind', 'unbind');

-- AlterTable
ALTER TABLE "Account"
ADD COLUMN "phoneE164" TEXT,
ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PhoneVerificationCode" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "scene" "PhoneVerificationScene" NOT NULL,
    "code" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "requestIp" TEXT,
    "providerCode" TEXT,
    "providerMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_phoneE164_key" ON "Account"("phoneE164");

-- CreateIndex
CREATE INDEX "PhoneVerificationCode_accountId_createdAt_idx" ON "PhoneVerificationCode"("accountId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PhoneVerificationCode_phoneE164_createdAt_idx" ON "PhoneVerificationCode"("phoneE164", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PhoneVerificationCode_requestIp_createdAt_idx" ON "PhoneVerificationCode"("requestIp", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PhoneVerificationCode_expiresAt_idx" ON "PhoneVerificationCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "PhoneVerificationCode" ADD CONSTRAINT "PhoneVerificationCode_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
