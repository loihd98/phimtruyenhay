-- AlterTable: add referenceCode column for SePay webhook idempotency
ALTER TABLE "payment_transactions" ADD COLUMN "referenceCode" TEXT;

-- CreateIndex: unique constraint on referenceCode to prevent duplicate webhook processing
CREATE UNIQUE INDEX "payment_transactions_referenceCode_key" ON "payment_transactions"("referenceCode");

-- CreateIndex: composite index on (amount, status) for efficient webhook amount matching
CREATE INDEX "payment_transactions_amount_status_idx" ON "payment_transactions"("amount", "status");
