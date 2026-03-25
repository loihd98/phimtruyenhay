const prisma = require("../lib/prisma");

/**
 * PermissionService — Database-driven RBAC with in-memory cache
 *
 * Cache structure:
 *   rolePermissions: Map<role, Set<permissionCode>>
 *   allPermissions: Permission[]
 *
 * TTL: 60 seconds
 */
class PermissionService {
  constructor() {
    this._cache = null;
    this._cacheTimestamp = 0;
    this._cacheTTL = 60 * 1000; // 60 seconds
  }

  /**
   * Refresh cache if expired
   */
  async _ensureCache() {
    const now = Date.now();
    if (this._cache && now - this._cacheTimestamp < this._cacheTTL) {
      return;
    }

    const [permissions, rolePermissions] = await Promise.all([
      prisma.permission.findMany({ orderBy: [{ group: "asc" }, { code: "asc" }] }),
      prisma.rolePermission.findMany({
        where: { granted: true },
        include: { permission: { select: { code: true } } },
      }),
    ]);

    // Build role → Set<code> map
    const roleMap = new Map();
    for (const rp of rolePermissions) {
      if (!roleMap.has(rp.role)) {
        roleMap.set(rp.role, new Set());
      }
      roleMap.get(rp.role).add(rp.permission.code);
    }

    this._cache = {
      permissions,
      roleMap,
    };
    this._cacheTimestamp = now;
  }

  /**
   * Invalidate cache (call after updates)
   */
  invalidateCache() {
    this._cache = null;
    this._cacheTimestamp = 0;
  }

  /**
   * Check if a role has a specific permission
   * ADMIN always bypasses all permission checks
   */
  async hasPermission(role, code) {
    if (role === "ADMIN") return true;

    await this._ensureCache();
    const codes = this._cache.roleMap.get(role);
    return codes ? codes.has(code) : false;
  }

  /**
   * Check if a role has any of the given permissions
   */
  async hasAnyPermission(role, codes) {
    if (role === "ADMIN") return true;

    await this._ensureCache();
    const roleCodes = this._cache.roleMap.get(role);
    if (!roleCodes) return false;
    return codes.some((code) => roleCodes.has(code));
  }

  /**
   * Get all permissions for a given user (by role)
   * Returns array of permission codes that are granted
   */
  async getUserPermissions(role) {
    if (role === "ADMIN") {
      await this._ensureCache();
      return this._cache.permissions.map((p) => p.code);
    }

    await this._ensureCache();
    const codes = this._cache.roleMap.get(role);
    return codes ? Array.from(codes) : [];
  }

  /**
   * Get all permissions
   */
  async getAllPermissions() {
    await this._ensureCache();
    return this._cache.permissions;
  }

  /**
   * Get full permission matrix (role → permission → granted)
   */
  async getPermissionMatrix() {
    const [permissions, rolePermissions] = await Promise.all([
      prisma.permission.findMany({
        orderBy: [{ group: "asc" }, { code: "asc" }],
      }),
      prisma.rolePermission.findMany(),
    ]);

    // Build matrix: { permissionId: { role: granted } }
    const matrix = {};
    for (const rp of rolePermissions) {
      if (!matrix[rp.permissionId]) {
        matrix[rp.permissionId] = {};
      }
      matrix[rp.permissionId][rp.role] = rp.granted;
    }

    // Group permissions
    const grouped = {};
    for (const perm of permissions) {
      if (!grouped[perm.group]) {
        grouped[perm.group] = [];
      }
      grouped[perm.group].push({
        ...perm,
        roles: {
          ADMIN: true, // ADMIN always has all
          EDITOR: matrix[perm.id]?.EDITOR ?? false,
          REVIEWER: matrix[perm.id]?.REVIEWER ?? false,
          USER: matrix[perm.id]?.USER ?? false,
        },
      });
    }

    return {
      groups: grouped,
      roles: ["ADMIN", "EDITOR", "REVIEWER", "USER"],
    };
  }

  /**
   * Update role permissions
   * @param {string} role - Role enum value
   * @param {Array<{permissionId: string, granted: boolean}>} updates
   */
  async updateRolePermissions(role, updates) {
    if (role === "ADMIN") {
      throw new Error("Không thể thay đổi quyền của ADMIN");
    }

    const operations = updates.map(({ permissionId, granted }) =>
      prisma.rolePermission.upsert({
        where: {
          role_permissionId: { role, permissionId },
        },
        update: { granted },
        create: { role, permissionId, granted },
      })
    );

    await prisma.$transaction(operations);
    this.invalidateCache();

    return { updated: updates.length };
  }
}

// Singleton instance
const permissionService = new PermissionService();

module.exports = permissionService;
