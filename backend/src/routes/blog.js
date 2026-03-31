const express = require("express");
const blogController = require("../controllers/blogController");
const { optionalAuth, requireAuth, requirePermission } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/", optionalAuth, blogController.getPosts);
router.get("/categories", blogController.getCategories);
router.get("/tags", blogController.getTags);

// Authenticated — my posts
router.get("/my-posts", requireAuth, blogController.getMyPosts);

// Admin routes (must be before /:slug)
router.get("/admin/all", requirePermission("blog.view"), blogController.adminGetAllPosts);

// Category management
router.post("/categories", requirePermission("blog.category.create"), blogController.createCategory);
router.put("/categories/:id", requirePermission("blog.category.update"), blogController.updateCategory);
router.delete("/categories/:id", requirePermission("blog.category.delete"), blogController.deleteCategory);

// Blog post CRUD (authenticated)
router.post("/", requirePermission("blog.create"), blogController.createPost);
router.put("/:id", requirePermission("blog.update"), blogController.updatePost);
router.delete("/:id", requirePermission("blog.delete"), blogController.deletePost);

// Blog post detail (must be last — catches /:slug)
router.get("/:slug", optionalAuth, blogController.getPostBySlug);

// Comments
router.get("/:slug/comments", blogController.getComments);
router.post("/:slug/comments", requireAuth, blogController.createComment);

module.exports = router;
