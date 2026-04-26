-- Add login scene for phone verification flow
ALTER TYPE "PhoneVerificationScene" ADD VALUE IF NOT EXISTS 'login';

-- Anonymous phone login code requests do not have accountId yet
ALTER TABLE "PhoneVerificationCode"
ALTER COLUMN "accountId" DROP NOT NULL;

-- Store encrypted secret backup for phone login
ALTER TABLE "Account"
ADD COLUMN IF NOT EXISTS "phoneLoginSecretCipher" BYTEA,
ADD COLUMN IF NOT EXISTS "phoneLoginSecretBackedUpAt" TIMESTAMP(3);
