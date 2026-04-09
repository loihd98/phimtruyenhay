const express = require("express");
const vipController = require("../controllers/vipController");

const router = express.Router();

// POST /hooks/sepay-payment
// SePay calls this URL after every bank transaction.
// Must remain public — no auth, no rate-limit wrapper.
router.post("/sepay-payment", vipController.sePayWebhook);

module.exports = router;
