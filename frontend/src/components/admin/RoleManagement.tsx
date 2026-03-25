"use client";

import React, { useState, useEffect, useCallback } from "react";
import { permissionsAPI } from "../../utils/api";
import { Permission, PermissionMatrix } from "../../types";
import toast from "react-hot-toast";

interface PendingChange {
  role: string;
  permissionId: string;
  granted: boolean;
}

const GROUP_LABELS: Record<string, string> = {
  story_text: "Truyện Text",
  story_audio: "Truyện Audio",
  film: "Phim",
  user: "Người dùng",
  admin: "Quản trị",
  media: "Media",
  moderation: "Kiểm duyệt",
};

const TYPE_LABELS: Record<string, string> = {
  view: "Xem",
  action: "Hành động",
};

const EDITABLE_ROLES = ["EDITOR", "USER"];

const RoleManagement: React.FC = () => {
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPermission, setNewPermission] = useState({
    code: "",
    name: "",
    group: "",
    type: "action" as "action" | "view",
    description: "",
  });

  const fetchMatrix = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await permissionsAPI.getPermissionMatrix();
      const data = (response as any).data || response;
      setMatrix(data);
    } catch (error) {
      console.error("Failed to load permission matrix:", error);
      toast.error("Lỗi tải ma trận phân quyền");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  const handleToggle = (
    role: string,
    permissionId: string,
    currentValue: boolean
  ) => {
    if (role === "ADMIN") return; // ADMIN cannot be modified

    const newGranted = !currentValue;

    setPendingChanges((prev: PendingChange[]) => {
      // Remove existing change for this role+permission if any
      const filtered = prev.filter(
        (c: PendingChange) => !(c.role === role && c.permissionId === permissionId)
      );
      return [...filtered, { role, permissionId, granted: newGranted }];
    });
  };

  const getEffectiveValue = (
    role: string,
    permissionId: string,
    originalValue: boolean
  ): boolean => {
    const pending = pendingChanges.find(
      (c: PendingChange) => c.role === role && c.permissionId === permissionId
    );
    return pending ? pending.granted : originalValue;
  };

  const isPending = (role: string, permissionId: string): boolean => {
    return pendingChanges.some(
      (c: PendingChange) => c.role === role && c.permissionId === permissionId
    );
  };

  const getPendingForRole = (role: string): PendingChange[] => {
    return pendingChanges.filter((c: PendingChange) => c.role === role);
  };

  const handleSaveRole = async (role: string) => {
    const changes = getPendingForRole(role);
    if (changes.length === 0) {
      toast("Không có thay đổi nào cho vai trò này");
      return;
    }

    setSavingRole(role);
    try {
      await permissionsAPI.updateRolePermissions(
        role,
        changes.map((c) => ({
          permissionId: c.permissionId,
          granted: c.granted,
        }))
      );
      toast.success(`Đã cập nhật ${changes.length} quyền cho ${role}`);
      // Clear pending changes for this role
      setPendingChanges((prev: PendingChange[]) => prev.filter((c: PendingChange) => c.role !== role));
      // Refresh matrix
      await fetchMatrix();
    } catch (error: any) {
      console.error("Failed to save permissions:", error);
      toast.error(error?.message || "Lỗi cập nhật quyền");
    } finally {
      setSavingRole(null);
    }
  };

  const handleDiscardRole = (role: string) => {
    setPendingChanges((prev: PendingChange[]) => prev.filter((c: PendingChange) => c.role !== role));
  };

  const handleAddPermission = async () => {
    if (!newPermission.code || !newPermission.name || !newPermission.group) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      await permissionsAPI.createPermission(newPermission);
      toast.success("Tạo quyền mới thành công");
      setShowAddForm(false);
      setNewPermission({
        code: "",
        name: "",
        group: "",
        type: "action",
        description: "",
      });
      await fetchMatrix();
    } catch (error: any) {
      toast.error(error?.message || "Lỗi tạo quyền");
    }
  };

  const handleDeletePermission = async (id: string, code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa quyền "${code}"?`)) return;

    try {
      await permissionsAPI.deletePermission(id);
      toast.success("Đã xóa quyền");
      await fetchMatrix();
    } catch (error: any) {
      toast.error(error?.message || "Lỗi xóa quyền");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Đang tải phân quyền...
        </span>
      </div>
    );
  }

  if (!matrix) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không thể tải dữ liệu phân quyền
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý phân quyền
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Cấu hình quyền cho từng vai trò. ADMIN luôn có toàn quyền.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {showAddForm ? "Đóng" : "+ Thêm quyền"}
        </button>
      </div>

      {/* Add Permission Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Thêm quyền mới
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mã quyền (code)
              </label>
              <input
                type="text"
                value={newPermission.code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewPermission({ ...newPermission, code: e.target.value })
                }
                placeholder="vd: story_text.publish"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tên hiển thị
              </label>
              <input
                type="text"
                value={newPermission.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewPermission({ ...newPermission, name: e.target.value })
                }
                placeholder="vd: Xuất bản truyện"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nhóm
              </label>
              <input
                type="text"
                value={newPermission.group}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewPermission({ ...newPermission, group: e.target.value })
                }
                placeholder="vd: story_text"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loại
              </label>
              <select
                value={newPermission.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setNewPermission({
                    ...newPermission,
                    type: e.target.value as "action" | "view",
                  })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="action">Hành động</option>
                <option value="view">Xem</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mô tả
              </label>
              <input
                type="text"
                value={newPermission.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewPermission({
                    ...newPermission,
                    description: e.target.value,
                  })
                }
                placeholder="Mô tả ngắn về quyền"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-3">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Hủy
            </button>
            <button
              onClick={handleAddPermission}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Tạo quyền
            </button>
          </div>
        </div>
      )}

      {/* Pending Changes Banner */}
      {pendingChanges.length > 0 && (
        <div className="sticky top-0 z-10 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                {pendingChanges.length} thay đổi chưa lưu
              </span>
            </div>
            <div className="flex space-x-2">
              {EDITABLE_ROLES.map((role) => {
                const count = getPendingForRole(role).length;
                if (count === 0) return null;
                return (
                  <div key={role} className="flex space-x-1">
                    <button
                      onClick={() => handleSaveRole(role)}
                      disabled={savingRole === role}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingRole === role
                        ? "Đang lưu..."
                        : `Lưu ${role} (${count})`}
                    </button>
                    <button
                      onClick={() => handleDiscardRole(role)}
                      className="px-3 py-1 text-gray-600 dark:text-gray-400 text-sm hover:text-red-600"
                    >
                      Hủy
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Permission Matrix Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-80">
                  Quyền
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                  Loại
                </th>
                {matrix.roles.map((role) => (
                  <th
                    key={role}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28"
                  >
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        role === "ADMIN"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          : role === "EDITOR"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {role}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16">
                  Xóa
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(matrix.groups).map(([group, permissions]) => (
                <React.Fragment key={group}>
                  {/* Group Header */}
                  <tr className="bg-gray-100 dark:bg-gray-700/50">
                    <td
                      colSpan={matrix.roles.length + 3}
                      className="px-4 py-2"
                    >
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">
                        {GROUP_LABELS[group] || group}
                      </span>
                    </td>
                  </tr>

                  {/* Permission Rows */}
                  {permissions.map((perm: Permission) => (
                    <tr
                      key={perm.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-4 py-2">
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {perm.name}
                          </span>
                          <span className="ml-2 text-xs text-gray-400 font-mono">
                            {perm.code}
                          </span>
                        </div>
                        {perm.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {perm.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            perm.type === "view"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                          }`}
                        >
                          {TYPE_LABELS[perm.type] || perm.type}
                        </span>
                      </td>
                      {matrix.roles.map((role) => {
                        const originalValue =
                          perm.roles?.[role as keyof typeof perm.roles] ?? false;
                        const effectiveValue = getEffectiveValue(
                          role,
                          perm.id,
                          originalValue
                        );
                        const hasPending = isPending(role, perm.id);
                        const isAdmin = role === "ADMIN";

                        return (
                          <td
                            key={role}
                            className="px-4 py-2 text-center"
                          >
                            <button
                              onClick={() =>
                                handleToggle(role, perm.id, effectiveValue)
                              }
                              disabled={isAdmin}
                              className={`relative w-6 h-6 rounded transition-all ${
                                isAdmin
                                  ? "cursor-not-allowed opacity-60"
                                  : "cursor-pointer hover:scale-110"
                              } ${
                                hasPending
                                  ? "ring-2 ring-yellow-400 ring-offset-1"
                                  : ""
                              }`}
                              title={
                                isAdmin
                                  ? "ADMIN luôn có toàn quyền"
                                  : hasPending
                                  ? "Thay đổi chưa lưu"
                                  : effectiveValue
                                  ? "Đã cấp quyền — nhấn để thu hồi"
                                  : "Chưa cấp quyền — nhấn để cấp"
                              }
                            >
                              {effectiveValue ? (
                                <svg
                                  className="w-6 h-6 text-green-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-6 h-6 text-gray-300 dark:text-gray-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() =>
                            handleDeletePermission(perm.id, perm.code)
                          }
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Xóa quyền"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
