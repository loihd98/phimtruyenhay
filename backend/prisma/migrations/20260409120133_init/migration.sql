-- CreateEnum
CREATE TYPE "VipPlanType" AS ENUM ('MONTH_1', 'MONTH_3', 'MONTH_6', 'MONTH_12');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'DETECTED', 'VERIFYING', 'COMPLETED', 'EXPIRED', 'FAILED');

-- CreateTable
CREATE TABLE "vip_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "VipPlanType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vip_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "VipPlanType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "transferContent" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountHolder" TEXT,
    "detectedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vip_subscriptions_paymentId_key" ON "vip_subscriptions"("paymentId");

-- CreateIndex
CREATE INDEX "vip_subscriptions_userId_idx" ON "vip_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "vip_subscriptions_endDate_idx" ON "vip_subscriptions"("endDate");

-- CreateIndex
CREATE INDEX "vip_subscriptions_isActive_idx" ON "vip_subscriptions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_transferContent_key" ON "payment_transactions"("transferContent");

-- CreateIndex
CREATE INDEX "payment_transactions_userId_idx" ON "payment_transactions"("userId");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_transferContent_idx" ON "payment_transactions"("transferContent");

-- CreateIndex
CREATE INDEX "payment_transactions_expiresAt_idx" ON "payment_transactions"("expiresAt");

-- AddForeignKey
ALTER TABLE "vip_subscriptions" ADD CONSTRAINT "vip_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_subscriptions" ADD CONSTRAINT "vip_subscriptions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
