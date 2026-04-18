const express = require("express");
const notificationController = require("../controllers/notificationController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// User routes (require auth)
router.get("/", authenticateToken, notificationController.getNotifications);
router.get("/unread-count", authenticateToken, notificationController.getUnreadCount);
router.put("/read-all", authenticateToken, notificationController.markAllAsRead);
router.put("/:id/read", authenticateToken, notificationController.markAsRead);

module.exports = router;
