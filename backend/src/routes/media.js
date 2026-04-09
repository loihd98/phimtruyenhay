const express = require("express");
const multer = require("multer");
const {
  MediaController,
  uploadAudio,
  uploadImage,
  uploadUniversal,
} = require("../controllers/mediaController");
const { authenticateToken } = require("../middleware/auth");
const permissionService = require("../utils/permissionService");

const router = express.Router();

// All media routes require authentication
router.use(authenticateToken);

// Permission check middleware — ADMIN bypasses, others need media permissions
const requireMediaPermission = (code) => async (req, res, next) => {
  if (req.user.role === "ADMIN") return next();
  try {
    const hasAccess = await permissionService.hasPermission(
      req.user.role,
      code,
    );
    if (!hasAccess) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Bạn không có quyền thực hiện hành động này",
      });
    }
    next();
  } catch (error) {
    console.error("Permission check error:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", message: "Lỗi kiểm tra quyền" });
  }
};

// Upload audio file
router.post(
  "/upload/audio",
  requireMediaPermission("media.upload"),
  uploadAudio,
  MediaController.uploadAudio,
);

// Upload image file
router.post(
  "/upload/image",
  requireMediaPermission("media.upload"),
  uploadImage,
  MediaController.uploadImage,
);

// Media management routes
router.get(
  "/",
  requireMediaPermission("media.view"),
  MediaController.getMediaFiles,
);
router.post(
  "/upload",
  requireMediaPermission("media.upload"),
  uploadUniversal,
  MediaController.uploadMediaToDatabase,
);

router.get(
  "/search",
  requireMediaPermission("media.view"),
  MediaController.searchMediaFiles,
);

// Get file info
router.get(
  "/files/:filename",
  requireMediaPermission("media.view"),
  MediaController.getFileInfo,
);

// File usage info
router.get(
  "/usages",
  requireMediaPermission("media.view"),
  MediaController.getFileUsages,
);

// List files
router.get(
  "/files",
  requireMediaPermission("media.view"),
  MediaController.listFiles,
);

// Delete file
router.delete(
  "/files/:filename",
  requireMediaPermission("media.delete"),
  MediaController.deleteFile,
);
router.delete(
  "/:id",
  requireMediaPermission("media.delete"),
  MediaController.deleteMediaFile,
);

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "Payload Too Large",
        message: "File quá lớn. Âm thanh tối đa 1.5GB, hình ảnh tối đa 100MB.",
      });
    }
  }

  if (error.message.includes("Chỉ cho phép upload")) {
    return res.status(400).json({
      error: "Invalid File Type",
      message: error.message,
    });
  }

  next(error);
});

module.exports = router;
