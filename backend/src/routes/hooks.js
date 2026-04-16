const express = require("express");
const vipController = require("../controllers/vipController");

const router = express.Router();

// POST /hooks/sepay-payment
// SePay calls this URL after every bank transaction.
// Must remain public — no auth, no rate-limit wrapper.
router.post("/sepay-payment", vipController.sePayWebhook);

// POST /hooks/gmail-payment
// Gmail scanner script calls this after detecting a bank transfer email.
// Auth via Bearer token (GMAIL_WEBHOOK_SECRET).
router.post("/gmail-payment", vipController.gmailPaymentWebhook);

module.exports = router;
