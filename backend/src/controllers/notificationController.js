const prisma = require("../lib/prisma");

class NotificationController {
  // GET /api/notifications — Get user notifications
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: {
            OR: [{ userId }, { userId: null }],
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.notification.count({
          where: {
            OR: [{ userId }, { userId: null }],
          },
        }),
        prisma.notification.count({
          where: {
            OR: [{ userId }, { userId: null }],
            isRead: false,
          },
        }),
      ]);

      res.json({
        data: notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi lấy thông báo",
      });
    }
  }

  // GET /api/notifications/unread-count — Get unread count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await prisma.notification.count({
        where: {
          OR: [{ userId }, { userId: null }],
          isRead: false,
        },
      });
      res.json({ data: count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // PUT /api/notifications/:id/read — Mark single notification as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await prisma.notification.findUnique({ where: { id } });
      if (!notification) {
        return res.status(404).json({ error: "Not Found" });
      }

      // Only allow marking own notifications or broadcasts
      if (notification.userId && notification.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      res.json({ message: "Đã đánh dấu đã đọc" });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // PUT /api/notifications/read-all — Mark all as read
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      await prisma.notification.updateMany({
        where: {
          OR: [{ userId }, { userId: null }],
          isRead: false,
        },
        data: { isRead: true },
      });
      res.json({ message: "Đã đánh dấu tất cả đã đọc" });
    } catch (error) {
      console.error("Mark all read error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // POST /api/admin/notifications — Create notification (admin)
  async adminCreateNotification(req, res) {
    try {
      const { userId, type, title, message, link, metadata } = req.body;

      if (!type || !title || !message) {
        return res.status(400).json({
          error: "Validation Error",
          message: "type, title, và message là bắt buộc",
        });
      }

      const notification = await prisma.notification.create({
        data: {
          userId: userId || null,
          type,
          title,
          message,
          link: link || null,
          metadata: metadata || null,
        },
      });

      res.status(201).json({ data: notification });
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // DELETE /api/admin/notifications/:id — Delete notification (admin)
  async adminDeleteNotification(req, res) {
    try {
      const { id } = req.params;
      await prisma.notification.delete({ where: { id } });
      res.json({ message: "Đã xóa thông báo" });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

// Helper: Create notification for specific events
async function createNotification({ userId, type, title, message, link, metadata }) {
  try {
    return await prisma.notification.create({
      data: { userId, type, title, message, link, metadata },
    });
  } catch (error) {
    console.error("Create notification helper error:", error);
  }
}

// Helper: Broadcast notification to all users (userId = null)
async function broadcastNotification({ type, title, message, link, metadata }) {
  return createNotification({ userId: null, type, title, message, link, metadata });
}

module.exports = new NotificationController();
module.exports.createNotification = createNotification;
module.exports.broadcastNotification = broadcastNotification;
