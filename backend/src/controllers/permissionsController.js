const prisma = require("../lib/prisma");
const permissionService = require("../utils/permissionService");

class PermissionsController {
  /**
   * GET /api/auth/me/permissions
   * Get current user's permissions
   */
  async getMyPermissions(req, res) {
    try {
      const permissions = await permissionService.getUserPermissions(req.user.role);
      res.json({
        data: {
          role: req.user.role,
          permissions,
        },
      });
    } catch (error) {
      console.error("Get my permissions error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Lỗi lấy danh sách quyền",
      });
    }
  }

  /**
   * GET /api/permissions
   * Get all permissions (admin only)
   */
  async getAllPermissions(req, res) {
    try {
      const permissions = await permissionService.getAllPermissions();
      res.json({ data: permissions });
    } catch (error) {
      console.error("Get all permissions error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Lỗi lấy danh sách quyền",
      });
    }
  }

  /**
   * GET /api/permissions/matrix
   * Get full permission matrix (admin only)
   */
  async getPermissionMatrix(req, res) {
    try {
      const matrix = await permissionService.getPermissionMatrix();
      res.json({ data: matrix });
    } catch (error) {
      console.error("Get permission matrix error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Lỗi lấy ma trận phân quyền",
      });
    }
  }

  /**
   * PUT /api/permissions/role/:role
   * Update permissions for a role (admin only)
   */
  async updateRolePermissions(req, res) {
    try {
      const { role } = req.params;
      const { updates } = req.body;

      // Validate role
      const validRoles = ["EDITOR", "USER"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Vai trò không hợp lệ. Không thể thay đổi quyền ADMIN.",
        });
      }

      // Validate updates
      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Danh sách cập nhật không hợp lệ",
        });
      }

      // Validate each update has permissionId and granted
      for (const update of updates) {
        if (!update.permissionId || typeof update.granted !== "boolean") {
          return res.status(400).json({
            error: "Bad Request",
            message: "Mỗi cập nhật cần có permissionId và granted (boolean)",
          });
        }
      }

      const result = await permissionService.updateRolePermissions(role, updates);

      res.json({
        message: `Đã cập nhật ${result.updated} quyền cho vai trò ${role}`,
        data: result,
      });
    } catch (error) {
      console.error("Update role permissions error:", error);
      if (error.message?.includes("Không thể thay đổi")) {
        return res.status(400).json({
          error: "Bad Request",
          message: error.message,
        });
      }
      res.status(500).json({
        error: "Internal Server Error",
        message: "Lỗi cập nhật quyền",
      });
    }
  }

  /**
   * POST /api/permissions
   * Create a new permission (admin only)
   */
  async createPermission(req, res) {
    try {
      const { code, name, group, type, description } = req.body;

      if (!code || !name || !group || !type) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Thiếu trường bắt buộc: code, name, group, type",
        });
      }

      if (!["action", "view"].includes(type)) {
        return res.status(400).json({
          error: "Bad Request",
          message: "type phải là 'action' hoặc 'view'",
        });
      }

      // Check uniqueness
      const existing = await prisma.permission.findUnique({ where: { code } });
      if (existing) {
        return res.status(409).json({
          error: "Conflict",
          message: `Permission "${code}" đã tồn tại`,
        });
      }

      const permission = await prisma.permission.create({
        data: { code, name, group, type, description },
      });

      permissionService.invalidateCache();

      res.status(201).json({
        message: "Tạo quyền thành công",
        data: permission,
      });
    } catch (error) {
      console.error("Create permission error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Lỗi tạo quyền",
      });
    }
  }

  /**
   * PATCH /api/permissions/:id
   * Update a permission (admin only)
   */
  async updatePermission(req, res) {
    try {
      const { id } = req.params;
      const { name, group, type, description } = req.body;

      const existing = await prisma.permission.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({
          error: "Not Found",
          message: "Không tìm thấy quyền",
        });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (group !== undefined) updateData.group = group;
      if (type !== undefined) {
        if (!["action", "view"].includes(type)) {
          return res.status(400).json({
            error: "Bad Request",
            message: "type phải là 'action' hoặc 'view'",
          });
        }
        updateData.type = type;
      }
      if (description !== undefined) updateData.description = description;

      const permission = await prisma.permission.update({
        where: { id },
        data: updateData,
      });

      permissionService.invalidateCache();

      res.json({
        message: "Cập nhật quyền thành công",
        data: permission,
      });
    } catch (error) {
      console.error("Update permission error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Lỗi cập nhật quyền",
      });
    }
  }

  /**
   * DELETE /api/permissions/:id
   * Delete a permission (admin only)
   */
  async deletePermission(req, res) {
    try {
      const { id } = req.params;

      const existing = await prisma.permission.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({
          error: "Not Found",
          message: "Không tìm thấy quyền",
        });
      }

      // Cascade will remove related RolePermission rows
      await prisma.permission.delete({ where: { id } });

      permissionService.invalidateCache();

      res.json({
        message: "Xóa quyền thành công",
      });
    } catch (error) {
      console.error("Delete permission error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Lỗi xóa quyền",
      });
    }
  }
}

module.exports = new PermissionsController();
