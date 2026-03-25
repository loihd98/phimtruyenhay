const express = require("express");
const permissionsController = require("../controllers/permissionsController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// All permission management routes require ADMIN
router.use(authenticateToken);

// GET /api/permissions — list all permissions (admin only)
router.get("/", requireAdmin[1], permissionsController.getAllPermissions);

// GET /api/permissions/matrix — full role-permission matrix (admin only)
router.get("/matrix", requireAdmin[1], permissionsController.getPermissionMatrix);

// PUT /api/permissions/role/:role — update role permissions (admin only)
router.put("/role/:role", requireAdmin[1], permissionsController.updateRolePermissions);

// POST /api/permissions — create permission (admin only)
router.post("/", requireAdmin[1], permissionsController.createPermission);

// PATCH /api/permissions/:id — update permission (admin only)
router.patch("/:id", requireAdmin[1], permissionsController.updatePermission);

// DELETE /api/permissions/:id — delete permission (admin only)
router.delete("/:id", requireAdmin[1], permissionsController.deletePermission);

module.exports = router;
