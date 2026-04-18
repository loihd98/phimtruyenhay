const express = require("express");
const adminController = require("../controllers/adminController");
const { authenticateToken, requireAdminAccess, requirePermission, requireAnyPermission } = require("../middleware/auth");

const router = express.Router();

// All admin routes require authentication + admin.access permission
// This replaces the old requireAdmin — ADMIN role still bypasses all checks
router.use(authenticateToken);
router.use(async (req, res, next) => {
  // ADMIN bypass
  if (req.user && req.user.role === "ADMIN") return next();
  // For other roles, check admin.access permission
  const permissionService = require("../utils/permissionService");
  try {
    const hasAccess = await permissionService.hasPermission(req.user.role, "admin.access");
    if (!hasAccess) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Bạn không có quyền truy cập tính năng này",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", message: "Lỗi kiểm tra quyền" });
  }
});

// Dashboard
router.get("/dashboard/stats", requirePermission("admin.dashboard.view")[1], adminController.getDashboardStats);

// User management
router.get("/users", requirePermission("user.view")[1], adminController.getUsers);
router.post("/users", requirePermission("user.update")[1], adminController.createUser);
router.patch("/users/:id", requirePermission("user.update")[1], adminController.updateUser);
router.patch("/users/:id/role", requirePermission("user.update")[1], adminController.updateUserRole);
router.delete("/users/:id", requirePermission("user.delete")[1], adminController.deleteUser);

// Story management (text & audio share same routes, differentiated by type)
router.get("/stories", requireAnyPermission(["story_text.view", "story_audio.view"])[1], adminController.getStories);
router.get("/stories/:id", requireAnyPermission(["story_text.view", "story_audio.view"])[1], adminController.getStoryById);
router.post("/stories", requireAnyPermission(["story_text.create", "story_audio.create"])[1], adminController.createStory);
router.patch("/stories/:id", requireAnyPermission(["story_text.update", "story_audio.update"])[1], adminController.updateStory);
router.put("/stories/:id", requireAnyPermission(["story_text.update", "story_audio.update"])[1], adminController.updateStory);
router.delete("/stories/:id", requireAnyPermission(["story_text.delete", "story_audio.delete"])[1], adminController.deleteStory);

// Chapter management
router.get("/chapters", requireAnyPermission(["story_text.view", "story_audio.view"])[1], adminController.getChapters);
router.post("/stories/:storyId/chapters", requireAnyPermission(["story_text.create", "story_audio.create"])[1], adminController.createChapter);
router.patch("/chapters/:id", requireAnyPermission(["story_text.update", "story_audio.update"])[1], adminController.updateChapter);
router.put("/chapters/:id", requireAnyPermission(["story_text.update", "story_audio.update"])[1], adminController.updateChapter);
router.delete("/chapters/:id", requireAnyPermission(["story_text.delete", "story_audio.delete"])[1], adminController.deleteChapter);

// Comment moderation
router.get("/comments", requirePermission("comment.moderate")[1], adminController.getComments);
router.get("/comments/pending", requirePermission("comment.moderate")[1], adminController.getPendingComments);
router.patch("/comments/:id/approve", requirePermission("comment.moderate")[1], adminController.approveComment);
router.delete("/comments/:id", requirePermission("comment.moderate")[1], adminController.deleteComment);

// Genre management
router.get("/genres", requireAnyPermission(["story_text.view", "story_audio.view"])[1], adminController.getGenres);
router.post("/genres", requireAnyPermission(["story_text.genre.create", "story_audio.genre.create"])[1], adminController.createGenre);
router.patch("/genres/:id", requireAnyPermission(["story_text.genre.update", "story_audio.genre.update"])[1], adminController.updateGenre);
router.delete("/genres/:id", requireAnyPermission(["story_text.genre.delete", "story_audio.genre.delete"])[1], adminController.deleteGenre);

// Affiliate link management (admin only — no specific permission, requires ADMIN)
router.get("/affiliate-links", adminController.getAffiliateLinks);
router.post("/affiliate-links", adminController.createAffiliateLink);
router.patch("/affiliate-links/:id", adminController.updateAffiliateLink);
router.delete("/affiliate-links/:id", adminController.deleteAffiliateLink);

// Media management - Mount media routes
const mediaRoutes = require("./media");
router.use("/media", mediaRoutes);

// Film Review management
const filmReviewsController = require("../controllers/filmReviewsController");
router.get("/film-reviews", requirePermission("film.view")[1], filmReviewsController.adminGetFilmReviews);
router.patch(
  "/film-reviews/bulk-affiliate",
  requirePermission("film.update")[1],
  filmReviewsController.adminBulkAssignAffiliate,
);
router.get("/film-reviews/:id", requirePermission("film.view")[1], filmReviewsController.adminGetFilmReviewById);
router.post("/film-reviews", requirePermission("film.create")[1], filmReviewsController.adminCreateFilmReview);
router.put("/film-reviews/:id", requirePermission("film.update")[1], filmReviewsController.adminUpdateFilmReview);
router.patch("/film-reviews/:id", requirePermission("film.update")[1], filmReviewsController.adminUpdateFilmReview);
router.delete("/film-reviews/:id", requirePermission("film.delete")[1], filmReviewsController.adminDeleteFilmReview);

// Film Episode management
router.post("/film-reviews/:filmId/episodes", requirePermission("film.create")[1], filmReviewsController.adminCreateEpisode);
router.put("/film-reviews/episodes/:id", requirePermission("film.update")[1], filmReviewsController.adminUpdateEpisode);
router.delete("/film-reviews/episodes/:id", requirePermission("film.delete")[1], filmReviewsController.adminDeleteEpisode);

// Film Category management
router.get("/film-categories", requirePermission("film.view")[1], filmReviewsController.adminGetFilmCategories);
router.post("/film-categories", requirePermission("film.genre.create")[1], filmReviewsController.adminCreateFilmCategory);
router.patch(
  "/film-categories/:id",
  requirePermission("film.genre.update")[1],
  filmReviewsController.adminUpdateFilmCategory,
);
router.delete(
  "/film-categories/:id",
  requirePermission("film.genre.delete")[1],
  filmReviewsController.adminDeleteFilmCategory,
);

// Film Comment management
router.get("/film-comments", requirePermission("review.moderate")[1], filmReviewsController.adminGetFilmComments);
router.patch(
  "/film-comments/:id/approve",
  requirePermission("review.moderate")[1],
  filmReviewsController.adminApproveFilmComment,
);
router.delete(
  "/film-comments/:id",
  requirePermission("review.moderate")[1],
  filmReviewsController.adminDeleteFilmComment,
);

// Sample data and analytics
router.post("/sample-data", adminController.createSampleData);
router.get("/analytics", requirePermission("admin.analytics.view")[1], adminController.getAnalytics);

// Notifications (admin)
const notificationController = require("../controllers/notificationController");
router.post("/notifications", notificationController.adminCreateNotification);
router.delete("/notifications/:id", notificationController.adminDeleteNotification);

module.exports = router;
