const prisma = require("../lib/prisma");
const crypto = require("crypto");

// VIP plan definitions
const VIP_PLANS = {
  MONTH_1: { label: "1 Tháng", months: 1, price: 37000 },
  MONTH_3: { label: "3 Tháng", months: 3, price: 99000 },
  MONTH_6: { label: "6 Tháng", months: 6, price: 189000 },
  MONTH_12: { label: "12 Tháng", months: 12, price: 369000 },
};

// Bank info — configurable via env
const BANK_INFO = {
  bankName: process.env.VIP_BANK_NAME || "BIDV",
  accountNumber: process.env.VIP_ACCOUNT_NUMBER || "2206502400",
  accountHolder: process.env.VIP_ACCOUNT_HOLDER || "HA DINH LOI",
  qrTemplate: process.env.VIP_QR_TEMPLATE || "",
};

// Payment timeout: 30 minutes (SePay webhook delivery can be delayed)
const PAYMENT_TIMEOUT_MS = 30 * 60 * 1000;
// Extra grace period for webhook: SePay may fire up to 30 min after payment expiry
const WEBHOOK_GRACE_MS = 30 * 60 * 1000;

class VipController {
  // GET /api/vip/plans — Get available VIP plans
  async getPlans(req, res) {
    try {
      const plans = Object.entries(VIP_PLANS).map(([key, plan]) => ({
        id: key,
        ...plan,
      }));

      res.json({ data: plans });
    } catch (error) {
      console.error("Get VIP plans error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi lấy danh sách gói VIP",
      });
    }
  }

  // GET /api/vip/status — Get current user VIP status
  async getStatus(req, res) {
    try {
      const userId = req.user.id;

      const activeSubscription = await prisma.vipSubscription.findFirst({
        where: {
          userId,
          isActive: true,
          endDate: { gt: new Date() },
        },
        orderBy: { endDate: "desc" },
      });

      res.json({
        data: {
          isVip: !!activeSubscription,
          subscription: activeSubscription,
        },
      });
    } catch (error) {
      console.error("Get VIP status error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi kiểm tra trạng thái VIP",
      });
    }
  }

  // POST /api/vip/create-payment — Create a payment transaction
  async createPayment(req, res) {
    try {
      const userId = req.user.id;
      const { plan } = req.body;

      if (!plan || !VIP_PLANS[plan]) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Gói VIP không hợp lệ",
        });
      }

      const planInfo = VIP_PLANS[plan];
      const baseAmount = planInfo.price;

      // Cancel any existing pending payments for this user
      await prisma.paymentTransaction.updateMany({
        where: {
          userId,
          status: "PENDING",
        },
        data: {
          status: "EXPIRED",
        },
      });

      // Generate unique amount (base + random 1-999 suffix) within serializable
      // transaction to prevent race conditions between concurrent requests
      const payment = await prisma.$transaction(
        async (tx) => {
          // Find amounts already taken by active (non-terminal) payments in suffix range
          const activePayments = await tx.paymentTransaction.findMany({
            where: {
              status: { in: ["PENDING", "DETECTED", "VERIFYING"] },
              amount: { gte: baseAmount + 1, lte: baseAmount + 999 },
            },
            select: { amount: true },
          });

          const usedAmounts = new Set(activePayments.map((p) => p.amount));

          // Try random suffix first for even distribution
          let suffix;
          for (let i = 0; i < 50; i++) {
            const candidate = Math.floor(Math.random() * 999) + 1;
            if (!usedAmounts.has(baseAmount + candidate)) {
              suffix = candidate;
              break;
            }
          }

          // Fallback: sequential scan for first available slot
          if (suffix === undefined) {
            for (let s = 1; s <= 999; s++) {
              if (!usedAmounts.has(baseAmount + s)) {
                suffix = s;
                break;
              }
            }
          }

          if (suffix === undefined) {
            throw new Error("NO_AVAILABLE_AMOUNT");
          }

          const finalAmount = baseAmount + suffix;
          const shortId = crypto.randomBytes(4).toString("hex").toUpperCase();
          const transferContent = `VIP${shortId}`;

          return tx.paymentTransaction.create({
            data: {
              userId,
              plan,
              amount: finalAmount,
              transferContent,
              status: "PENDING",
              bankName: BANK_INFO.bankName,
              accountNumber: BANK_INFO.accountNumber,
              accountHolder: BANK_INFO.accountHolder,
              expiresAt: new Date(Date.now() + PAYMENT_TIMEOUT_MS),
              ipAddress: req.ip,
              userAgent: req.headers["user-agent"],
            },
          });
        },
        { isolationLevel: "Serializable" }
      );

      // Build QR URL (VietQR standard) with exact unique amount
      const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.bankName}-${BANK_INFO.accountNumber}-compact.png?amount=${payment.amount}&addInfo=${payment.transferContent}&accountName=${encodeURIComponent(BANK_INFO.accountHolder)}`;

      res.status(201).json({
        data: {
          paymentId: payment.id,
          plan: planInfo,
          amount: payment.amount,
          transferContent: payment.transferContent,
          bankInfo: BANK_INFO,
          qrUrl,
          expiresAt: payment.expiresAt,
        },
      });
    } catch (error) {
      if (error.message === "NO_AVAILABLE_AMOUNT") {
        return res.status(503).json({
          error: "Service Unavailable",
          message: "Hệ thống đang bận, vui lòng thử lại sau vài phút",
        });
      }
      console.error("Create payment error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi tạo thanh toán",
      });
    }
  }

  // GET /api/vip/payment-status/:paymentId — Check payment status (for polling)
  async getPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      const payment = await prisma.paymentTransaction.findFirst({
        where: {
          id: paymentId,
          userId,
        },
      });

      if (!payment) {
        return res.status(404).json({
          error: "Not Found",
          message: "Không tìm thấy giao dịch",
        });
      }

      // Check if expired (auto-expire PENDING or stuck DETECTED payments)
      if (["PENDING", "DETECTED"].includes(payment.status) && new Date() > payment.expiresAt) {
        await prisma.paymentTransaction.update({
          where: { id: paymentId },
          data: { status: "EXPIRED" },
        });
        return res.json({ data: { ...payment, status: "EXPIRED" } });
      }

      res.json({ data: payment });
    } catch (error) {
      console.error("Get payment status error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi kiểm tra trạng thái thanh toán",
      });
    }
  }

  // POST /api/vip/verify-payment/:paymentId — Admin verify payment manually
  async verifyPayment(req, res) {
    try {
      const { paymentId } = req.params;

      const payment = await prisma.paymentTransaction.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        return res.status(404).json({
          error: "Not Found",
          message: "Không tìm thấy giao dịch",
        });
      }

      if (payment.status === "COMPLETED") {
        return res.status(400).json({
          error: "Bad Request",
          message: "Giao dịch đã được xác nhận trước đó",
        });
      }

      const planInfo = VIP_PLANS[payment.plan];
      if (!planInfo) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Gói VIP không hợp lệ",
        });
      }

      // Calculate subscription dates
      const startDate = new Date();
      
      // Check if user has an existing active subscription — extend it
      const existingSub = await prisma.vipSubscription.findFirst({
        where: {
          userId: payment.userId,
          isActive: true,
          endDate: { gt: new Date() },
        },
        orderBy: { endDate: "desc" },
      });

      const baseDate = existingSub ? existingSub.endDate : startDate;
      const endDate = new Date(baseDate);
      endDate.setMonth(endDate.getMonth() + planInfo.months);

      // Use a transaction to ensure atomicity
      const [updatedPayment, subscription] = await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: paymentId },
          data: {
            status: "COMPLETED",
            verifiedAt: new Date(),
          },
        }),
        prisma.vipSubscription.create({
          data: {
            userId: payment.userId,
            plan: payment.plan,
            amount: payment.amount,
            startDate,
            endDate,
            isActive: true,
            paymentId: payment.id,
          },
        }),
      ]);

      res.json({
        message: "Xác nhận thanh toán thành công — Tài khoản đã được nâng cấp VIP!",
        data: {
          payment: updatedPayment,
          subscription,
        },
      });
    } catch (error) {
      console.error("Verify payment error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi xác nhận thanh toán",
      });
    }
  }

  // GET /api/vip/admin/payments — Admin: list all payment transactions
  async adminGetPayments(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const { status, search } = req.query;

      const where = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { transferContent: { contains: search, mode: "insensitive" } },
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [payments, total] = await Promise.all([
        prisma.paymentTransaction.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
            subscription: { select: { id: true, startDate: true, endDate: true, isActive: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.paymentTransaction.count({ where }),
      ]);

      res.json({
        data: payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Admin get payments error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi lấy danh sách giao dịch",
      });
    }
  }

  // POST /api/vip/webhook/sepay — SePay automatic bank transfer webhook (PUBLIC, no auth)
  async sePayWebhook(req, res) {
    try {
      // Log every incoming webhook call for debugging
      console.log(`[SePay webhook] ${new Date().toISOString()} — body:`, JSON.stringify(req.body));
      // SePay sends: Authorization: Apikey <token>
      const sePayToken = process.env.SEPAY_WEBHOOK_TOKEN;
      if (sePayToken) {
        const authHeader = req.headers["authorization"] || "";
        const providedToken = authHeader.replace(/^Apikey\s+/i, "").trim();
        if (providedToken !== sePayToken) {
          console.warn("SePay webhook: invalid API key");
          return res.status(401).json({ success: false, message: "Unauthorized" });
        }
      }

      // SePay payload shape: { id, gateway, transactionDate, accountNumber, subAccount,
      //   code, content, transferType, transferAmount, accumulated, referenceCode }
      const { transferAmount, transferType, referenceCode } = req.body;

      // Only process incoming transfers
      if (transferType && transferType !== "in") {
        return res.json({ success: true, message: "Bỏ qua giao dịch ra" });
      }

      const receivedAmount = parseInt(String(transferAmount), 10) || 0;
      if (receivedAmount <= 0) {
        return res.json({ success: true, message: "Số tiền không hợp lệ" });
      }

      // Idempotent: if SePay fires the same webhook twice, referenceCode will match
      if (referenceCode) {
        const alreadyProcessed = await prisma.paymentTransaction.findFirst({
          where: { referenceCode: String(referenceCode) },
        });
        if (alreadyProcessed) {
          console.log(`SePay webhook: duplicate referenceCode ${referenceCode}, skipping`);
          return res.json({ success: true, message: "Giao dịch đã xử lý" });
        }
      }

      // Match by exact amount among active payments (with grace period for late webhooks)
      const matched = await prisma.paymentTransaction.findFirst({
        where: {
          amount: receivedAmount,
          status: { in: ["PENDING", "DETECTED", "VERIFYING"] },
          expiresAt: { gt: new Date(Date.now() - WEBHOOK_GRACE_MS) },
        },
        orderBy: { createdAt: "asc" }, // oldest matching payment first
      });

      if (!matched) {
        console.warn(`SePay webhook: no matching PENDING payment for amount ${receivedAmount}`);
        return res.json({ success: true, message: "Không tìm thấy giao dịch khớp" });
      }

      // Idempotent: already completed
      if (matched.status === "COMPLETED") {
        return res.json({ success: true, message: "Giao dịch đã xử lý" });
      }

      const planInfo = VIP_PLANS[matched.plan];
      if (!planInfo) {
        return res.json({ success: false, message: "Gói VIP không hợp lệ" });
      }

      // Mark as DETECTED immediately — atomically set referenceCode (unique) to prevent
      // duplicate processing if SePay fires the same webhook concurrently
      try {
        await prisma.paymentTransaction.update({
          where: { id: matched.id },
          data: {
            status: "DETECTED",
            detectedAt: new Date(),
            ...(referenceCode ? { referenceCode: String(referenceCode) } : {}),
          },
        });
      } catch (detectErr) {
        // P2002 on referenceCode unique constraint → concurrent duplicate webhook
        if (detectErr.code === "P2002") {
          console.log(`SePay webhook: concurrent duplicate for referenceCode ${referenceCode}, idempotent OK`);
          return res.json({ success: true, message: "Giao dịch đã xử lý" });
        }
        throw detectErr;
      }

      // Duration in days (not calendar months to avoid DST issues)
      const PLAN_DAYS = { MONTH_1: 30, MONTH_3: 90, MONTH_6: 180, MONTH_12: 365 };
      const daysToAdd = PLAN_DAYS[matched.plan] ?? 30;

      // Extend existing active subscription or create from now
      const existingSub = await prisma.vipSubscription.findFirst({
        where: {
          userId: matched.userId,
          isActive: true,
          endDate: { gt: new Date() },
        },
        orderBy: { endDate: "desc" },
      });

      const baseDate = existingSub ? existingSub.endDate : new Date();
      const endDate = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      const startDate = new Date();

      try {
        await prisma.$transaction([
          prisma.paymentTransaction.update({
            where: { id: matched.id },
            data: { status: "COMPLETED", verifiedAt: new Date() },
          }),
          prisma.vipSubscription.create({
            data: {
              userId: matched.userId,
              plan: matched.plan,
              amount: matched.amount,
              startDate,
              endDate,
              isActive: true,
              paymentId: matched.id,
            },
          }),
        ]);
      } catch (txError) {
        // P2002 = unique constraint violation on VipSubscription.paymentId
        // Means a concurrent webhook already created the subscription — idempotent, just ensure COMPLETED
        if (txError.code === "P2002") {
          await prisma.paymentTransaction.update({
            where: { id: matched.id },
            data: { status: "COMPLETED", verifiedAt: new Date() },
          });
          console.log(`SePay webhook: duplicate call for payment ${matched.id}, idempotent OK`);
        } else {
          throw txError;
        }
      }

      console.log(`SePay webhook: activated VIP for user ${matched.userId}, plan ${matched.plan}, amount ${matched.amount}, endDate ${endDate}`);
      return res.json({ success: true, message: "Kích hoạt VIP thành công" });
    } catch (error) {
      console.error("SePay webhook error:", error);
      // Always return 200 to SePay so it doesn't retry endlessly
      return res.json({ success: false, message: "Lỗi xử lý webhook" });
    }
  }

  // POST /api/vip/reject-payment/:paymentId — Admin: reject/cancel a payment
  async rejectPayment(req, res) {
    try {
      const { paymentId } = req.params;

      const payment = await prisma.paymentTransaction.findUnique({ where: { id: paymentId } });
      if (!payment) {
        return res.status(404).json({ error: "Not Found", message: "Không tìm thấy giao dịch" });
      }
      if (payment.status === "COMPLETED") {
        return res.status(400).json({ error: "Bad Request", message: "Không thể từ chối giao dịch đã hoàn thành" });
      }

      const updated = await prisma.paymentTransaction.update({
        where: { id: paymentId },
        data: { status: "FAILED" },
      });

      res.json({ message: "Đã từ chối giao dịch", data: updated });
    } catch (error) {
      console.error("Reject payment error:", error);
      res.status(500).json({ error: "Internal Server Error", message: "Có lỗi xảy ra khi từ chối giao dịch" });
    }
  }

  // POST /api/vip/extend-subscription/:subscriptionId — Admin: extend a subscription
  async extendSubscription(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { days } = req.body;

      if (!days || isNaN(parseInt(days)) || parseInt(days) <= 0) {
        return res.status(400).json({ error: "Validation Error", message: "Số ngày gia hạn không hợp lệ" });
      }

      const sub = await prisma.vipSubscription.findUnique({ where: { id: subscriptionId } });
      if (!sub) {
        return res.status(404).json({ error: "Not Found", message: "Không tìm thấy thuê bao VIP" });
      }

      const baseDate = sub.endDate > new Date() ? sub.endDate : new Date();
      const newEndDate = new Date(baseDate.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);

      const updated = await prisma.vipSubscription.update({
        where: { id: subscriptionId },
        data: { endDate: newEndDate, isActive: true },
      });

      res.json({ message: `Đã gia hạn ${days} ngày thành công`, data: updated });
    } catch (error) {
      console.error("Extend subscription error:", error);
      res.status(500).json({ error: "Internal Server Error", message: "Có lỗi xảy ra khi gia hạn VIP" });
    }
  }

  // POST /api/vip/cancel-subscription/:subscriptionId — Admin: cancel a subscription
  async cancelSubscription(req, res) {
    try {
      const { subscriptionId } = req.params;

      const sub = await prisma.vipSubscription.findUnique({ where: { id: subscriptionId } });
      if (!sub) {
        return res.status(404).json({ error: "Not Found", message: "Không tìm thấy thuê bao VIP" });
      }

      const updated = await prisma.vipSubscription.update({
        where: { id: subscriptionId },
        data: { isActive: false },
      });

      res.json({ message: "Đã hủy thuê bao VIP", data: updated });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ error: "Internal Server Error", message: "Có lỗi xảy ra khi hủy VIP" });
    }
  }

  // PUT /api/vip/update-subscription/:subscriptionId — Admin: set custom end date
  async updateSubscriptionExpiry(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { endDate } = req.body;

      if (!endDate || isNaN(new Date(endDate).getTime())) {
        return res.status(400).json({ error: "Validation Error", message: "Ngày hết hạn không hợp lệ" });
      }

      const sub = await prisma.vipSubscription.findUnique({ where: { id: subscriptionId } });
      if (!sub) {
        return res.status(404).json({ error: "Not Found", message: "Không tìm thấy thuê bao VIP" });
      }

      const newEndDate = new Date(endDate);
      const updated = await prisma.vipSubscription.update({
        where: { id: subscriptionId },
        data: {
          endDate: newEndDate,
          isActive: newEndDate > new Date(),
        },
      });

      res.json({ message: "Đã cập nhật ngày hết hạn VIP", data: updated });
    } catch (error) {
      console.error("Update subscription expiry error:", error);
      res.status(500).json({ error: "Internal Server Error", message: "Có lỗi xảy ra khi cập nhật VIP" });
    }
  }

  // GET /api/vip/admin/subscriptions — Admin: list all VIP subscriptions
  async adminGetSubscriptions(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const { active } = req.query;

      const where = {};
      if (active === "true") {
        where.isActive = true;
        where.endDate = { gt: new Date() };
      } else if (active === "false") {
        where.OR = [
          { isActive: false },
          { endDate: { lte: new Date() } },
        ];
      }

      const [subscriptions, total] = await Promise.all([
        prisma.vipSubscription.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.vipSubscription.count({ where }),
      ]);

      res.json({
        data: subscriptions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Admin get subscriptions error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi lấy danh sách VIP",
      });
    }
  }
}

module.exports = new VipController();
