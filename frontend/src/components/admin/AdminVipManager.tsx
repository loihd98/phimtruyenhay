"use client";

import React, { useState, useEffect, useCallback } from "react";
import apiClient from "@/utils/api";

interface Payment {
  id: string;
  plan: string;
  amount: number;
  transferContent: string;
  status: string;
  qrUrl: string;
  expiresAt: string;
  verifiedAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar: string | null };
  subscription: { id: string; startDate: string; endDate: string; isActive: boolean } | null;
}

interface Subscription {
  id: string;
  plan: string;
  amount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar: string | null };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const PLAN_LABELS: Record<string, string> = {
  MONTH_1: "1 Tháng",
  MONTH_3: "3 Tháng",
  MONTH_6: "6 Tháng",
  MONTH_12: "12 Tháng",
};

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  PENDING: { text: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  DETECTED: { text: "Phát hiện GD", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  VERIFYING: { text: "Đang xác minh", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" },
  COMPLETED: { text: "Hoàn thành", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  EXPIRED: { text: "Hết hạn", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
  FAILED: { text: "Thất bại", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

// ─── Inline modal components ────────────────────────────────────────────────

function ExtendModal({ sub, onClose, onSuccess }: {
  sub: Subscription;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const d = parseInt(days);
    if (!d || d <= 0) { alert("Vui lòng nhập số ngày hợp lệ"); return; }
    setLoading(true);
    try {
      await apiClient.post(`/vip/extend-subscription/${sub.id}`, { days: d });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">⏳ Gia hạn VIP</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          User: <strong>{sub.user.name}</strong> — HH: {new Date(sub.endDate).toLocaleDateString("vi-VN")}
        </p>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Số ngày gia hạn</label>
        <input
          type="number"
          min="1"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-yellow-500"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Hủy</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-semibold hover:bg-yellow-400 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Gia hạn"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditExpiryModal({ sub, onClose, onSuccess }: {
  sub: Subscription;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toInputDate = (d: string) => new Date(d).toISOString().slice(0, 10);
  const [endDate, setEndDate] = useState(toInputDate(sub.endDate));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!endDate) { alert("Vui lòng chọn ngày hết hạn"); return; }
    setLoading(true);
    try {
      await apiClient.put(`/vip/update-subscription/${sub.id}`, { endDate });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">📅 Đặt ngày hết hạn</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">User: <strong>{sub.user.name}</strong></p>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngày hết hạn mới</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-yellow-500"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Hủy</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function AdminVipManager() {
  const [tab, setTab] = useState<"payments" | "subscriptions">("payments");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  // Modals
  const [extendModal, setExtendModal] = useState<Subscription | null>(null);
  const [editExpiryModal, setEditExpiryModal] = useState<Subscription | null>(null);

  const fetchPayments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await apiClient.get(`/vip/admin/payments?${params}`);
      setPayments(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  const fetchSubscriptions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (activeFilter) params.set("active", activeFilter);
      const res = await apiClient.get(`/vip/admin/subscriptions?${params}`);
      setSubscriptions(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    if (tab === "payments") fetchPayments();
    else fetchSubscriptions();
  }, [tab, fetchPayments, fetchSubscriptions]);

  const handleVerify = async (paymentId: string) => {
    if (!confirm("Xác nhận thanh toán này? Tài khoản sẽ được nâng cấp VIP ngay lập tức.")) return;
    setActionId(paymentId);
    try {
      await apiClient.post(`/vip/verify-payment/${paymentId}`);
      fetchPayments(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!confirm("Từ chối giao dịch này? Trạng thái sẽ chuyển thành Thất bại.")) return;
    setActionId(paymentId);
    try {
      await apiClient.post(`/vip/reject-payment/${paymentId}`);
      fetchPayments(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (subId: string) => {
    if (!confirm("Hủy thuê bao VIP này? Người dùng sẽ mất quyền VIP ngay lập tức.")) return;
    setActionId(subId);
    try {
      await apiClient.post(`/vip/cancel-subscription/${subId}`);
      fetchSubscriptions(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const formatPrice = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

  return (
    <div className="space-y-6">
      {/* Modals */}
      {extendModal && (
        <ExtendModal
          sub={extendModal}
          onClose={() => setExtendModal(null)}
          onSuccess={() => fetchSubscriptions(pagination.page)}
        />
      )}
      {editExpiryModal && (
        <EditExpiryModal
          sub={editExpiryModal}
          onClose={() => setEditExpiryModal(null)}
          onSuccess={() => fetchSubscriptions(pagination.page)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">👑 Quản lý VIP</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("payments")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "payments"
                ? "bg-yellow-500 text-black"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Giao dịch
          </button>
          <button
            onClick={() => setTab("subscriptions")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "subscriptions"
                ? "bg-yellow-500 text-black"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Thuê bao VIP
          </button>
        </div>
      </div>

      {/* Filters */}
      {tab === "payments" && (
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email hoặc mã CK..."
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            onKeyDown={(e) => e.key === "Enter" && fetchPayments()}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ thanh toán</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="FAILED">Thất bại</option>
            <option value="EXPIRED">Hết hạn</option>
          </select>
          <button
            onClick={() => fetchPayments()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Tìm
          </button>
        </div>
      )}

      {tab === "subscriptions" && (
        <div className="flex gap-3">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Tất cả</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Hết hạn</option>
          </select>
          <button onClick={() => fetchSubscriptions()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Lọc</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
          </div>
        ) : tab === "payments" ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Gói</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Số tiền</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Nội dung CK</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Ngày tạo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {payments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Chưa có giao dịch nào</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{p.user.name}</div>
                    <div className="text-xs text-gray-500">{p.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{PLAN_LABELS[p.plan] || p.plan}</td>
                  <td className="px-4 py-3 font-medium text-yellow-600 dark:text-yellow-400">{formatPrice(p.amount)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{p.transferContent}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_LABELS[p.status]?.color || ""}`}>
                      {STATUS_LABELS[p.status]?.text || p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {(p.status === "PENDING" || p.status === "DETECTED" || p.status === "VERIFYING") && (
                        <>
                          <button
                            onClick={() => handleVerify(p.id)}
                            disabled={actionId === p.id}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            {actionId === p.id ? "..." : "✅ Xác nhận"}
                          </button>
                          <button
                            onClick={() => handleReject(p.id)}
                            disabled={actionId === p.id}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            {actionId === p.id ? "..." : "❌ Từ chối"}
                          </button>
                        </>
                      )}
                      {p.status === "COMPLETED" && p.verifiedAt && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          ✓ {formatDate(p.verifiedAt)}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Gói</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Số tiền</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Bắt đầu</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Hết hạn</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {subscriptions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Chưa có thuê bao VIP nào</td></tr>
              ) : subscriptions.map((s) => {
                const isExpired = new Date(s.endDate) < new Date();
                const isActive = s.isActive && !isExpired;
                return (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{s.user.name}</div>
                      <div className="text-xs text-gray-500">{s.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{PLAN_LABELS[s.plan] || s.plan}</td>
                    <td className="px-4 py-3 font-medium text-yellow-600 dark:text-yellow-400">{formatPrice(s.amount)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{formatDate(s.startDate)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{formatDate(s.endDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400"
                      }`}>
                        {isActive ? "✅ Đang hoạt động" : "⏸ Hết hạn"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setExtendModal(s)}
                          className="px-3 py-1.5 bg-yellow-500 text-black text-xs font-medium rounded-lg hover:bg-yellow-400 whitespace-nowrap"
                        >
                          ⏳ Gia hạn
                        </button>
                        <button
                          onClick={() => setEditExpiryModal(s)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 whitespace-nowrap"
                        >
                          📅 Sửa ngày
                        </button>
                        {isActive && (
                          <button
                            onClick={() => handleCancel(s.id)}
                            disabled={actionId === s.id}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            {actionId === s.id ? "..." : "🚫 Hủy VIP"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Trang {pagination.page}/{pagination.pages} — Tổng {pagination.total} mục
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => tab === "payments" ? fetchPayments(pagination.page - 1) : fetchSubscriptions(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50"
            >
              ←
            </button>
            <button
              onClick={() => tab === "payments" ? fetchPayments(pagination.page + 1) : fetchSubscriptions(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
