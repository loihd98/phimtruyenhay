const express = require("express");
const vipController = require("../controllers/vipController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Public: get VIP plans (no auth needed)
router.get("/plans", vipController.getPlans);

// Public: SePay webhook — no auth, must stay public
router.post("/webhook/sepay", vipController.sePayWebhook);

// User: VIP status (requires auth)
router.get("/status", authenticateToken, vipController.getStatus);

// User: create payment (requires auth)
router.post("/create-payment", authenticateToken, vipController.createPayment);

// User: check payment status (requires auth, polling)
router.get("/payment-status/:paymentId", authenticateToken, vipController.getPaymentStatus);

// Admin: verify payment (approve manually)
router.post("/verify-payment/:paymentId", authenticateToken, requireAdmin[1], vipController.verifyPayment);

// Admin: reject payment
router.post("/reject-payment/:paymentId", authenticateToken, requireAdmin[1], vipController.rejectPayment);

// Admin: extend subscription
router.post("/extend-subscription/:subscriptionId", authenticateToken, requireAdmin[1], vipController.extendSubscription);

// Admin: cancel subscription
router.post("/cancel-subscription/:subscriptionId", authenticateToken, requireAdmin[1], vipController.cancelSubscription);

// Admin: update subscription expiry date
router.put("/update-subscription/:subscriptionId", authenticateToken, requireAdmin[1], vipController.updateSubscriptionExpiry);

// Admin: list payments
router.get("/admin/payments", authenticateToken, requireAdmin[1], vipController.adminGetPayments);

// Admin: list subscriptions
router.get("/admin/subscriptions", authenticateToken, requireAdmin[1], vipController.adminGetSubscriptions);

module.exports = router;
