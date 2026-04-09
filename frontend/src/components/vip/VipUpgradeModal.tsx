"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import apiClient from "@/utils/api";
import { VipPlan, PaymentCreateResponse, PaymentStatus } from "@/types";
import { fetchVipStatus } from "@/store/slices/vipSlice";
import { AppDispatch } from "@/store";

interface VipUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const POLL_INTERVAL = 5000; // 5 seconds

export default function VipUpgradeModal({ isOpen, onClose, onSuccess }: VipUpgradeModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState<"plans" | "payment">("plans");
  const [plans, setPlans] = useState<VipPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<VipPlan | null>(null);
  const [payment, setPayment] = useState<PaymentCreateResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityHandlerRef = useRef<(() => void) | null>(null);

  // Fetch plans on mount
  useEffect(() => {
    if (!isOpen) return;
    const fetchPlans = async () => {
      try {
        const res = await apiClient.get("/vip/plans");
        if (res.data?.data) {
          setPlans(res.data.data);
        }
      } catch {
        setError("Không thể tải danh sách gói VIP");
      }
    };
    fetchPlans();
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (step !== "payment" || !payment) return;

    const expiresAt = new Date(payment.expiresAt).getTime();
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setPaymentStatus("EXPIRED");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, payment]);

  // Poll payment status
  const startPolling = useCallback((paymentId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    const poll = async () => {
      try {
        const res = await apiClient.get(`/vip/payment-status/${paymentId}`);
        const status = res.data?.data?.status;
        if (status) {
          setPaymentStatus((prev) => {
            // When we first detect the transfer, switch to faster polling (2s)
            if (prev !== "DETECTED" && status === "DETECTED") {
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = setInterval(poll, 2000);
            }
            return status;
          });
          if (status === "COMPLETED" || status === "EXPIRED" || status === "FAILED") {
            if (pollRef.current) clearInterval(pollRef.current);
            if (status === "COMPLETED") {
              // Refresh VIP state in Redux immediately
              dispatch(fetchVipStatus());
              if (onSuccess) setTimeout(() => onSuccess(), 2000);
            }
          }
        }
      } catch {
        // Continue polling on error
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL);

    // Also re-poll when user returns from background tab (e.g. bank app)
    if (visibilityHandlerRef.current) {
      document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
    }
    visibilityHandlerRef.current = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", visibilityHandlerRef.current);
  }, [dispatch, onSuccess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (visibilityHandlerRef.current) {
        document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
        visibilityHandlerRef.current = null;
      }
    };
  }, []);

  const handleSelectPlan = async (plan: VipPlan) => {
    setSelectedPlan(plan);
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post("/vip/create-payment", { plan: plan.id });
      if (res.data?.data) {
        setPayment(res.data.data);
        setPaymentStatus("PENDING");
        setStep("payment");
        startPolling(res.data.data.paymentId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi tạo thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (visibilityHandlerRef.current) {
      document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
      visibilityHandlerRef.current = null;
    }
    setStep("plans");
    setPayment(null);
    setPaymentStatus("PENDING");
    setSelectedPlan(null);
    setError(null);
    onClose();
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN").format(price) + "đ";

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!isOpen || typeof document === "undefined") return null;

  const statusConfig: Record<string, { icon: string; text: string; color: string }> = {
    PENDING: { icon: "⏳", text: "Đang chờ quét QR...", color: "text-yellow-400" },
    DETECTED: { icon: "🔍", text: "Phát hiện giao dịch!", color: "text-blue-400" },
    VERIFYING: { icon: "🔄", text: "Đang xác minh...", color: "text-blue-400" },
    COMPLETED: { icon: "✅", text: "Thanh toán thành công!", color: "text-green-400" },
    EXPIRED: { icon: "⌛", text: "Đã hết thời gian", color: "text-red-400" },
    FAILED: { icon: "❌", text: "Thanh toán thất bại", color: "text-red-400" },
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div
        className="relative bg-gradient-to-br from-[#16122a] via-[#161625] to-[#0e0e1c] border border-white/[0.10] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white z-10"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6">
          {step === "plans" && (
            <>
              {/* VIP Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 flex items-center justify-center text-4xl">
                  👑
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Nâng cấp VIP</h2>
                <p className="text-sm text-zinc-400">Trải nghiệm tất cả nội dung không giới hạn</p>
              </div>

              {/* Benefits */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-yellow-400 mb-3">🌟 Quyền lợi VIP</h3>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Truy cập toàn bộ thư viện VIP
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Không quảng cáo, không popup ủng hộ
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Chất lượng audio cao
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Xem trước tập mới sớm
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Hỗ trợ ưu tiên
                  </li>
                </ul>
              </div>

              {/* Plan cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {plans.map((plan) => {
                  const isPopular = plan.id === "MONTH_3";
                  const monthlyPrice = Math.round(plan.price / plan.months);
                  return (
                    <button
                      key={plan.id}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={loading}
                      className={`relative p-4 rounded-2xl border transition-all text-left ${
                        isPopular
                          ? "border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/15"
                          : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                      } ${loading ? "opacity-50 cursor-wait" : ""}`}
                    >
                      {isPopular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-2.5 py-0.5 rounded-full">
                          Phổ biến
                        </span>
                      )}
                      <p className="text-base font-bold text-white mb-1">{plan.label}</p>
                      <p className="text-lg font-bold text-yellow-400">{formatPrice(plan.price)}</p>
                      <p className="text-xs text-zinc-500 mt-1">~{formatPrice(monthlyPrice)}/tháng</p>
                    </button>
                  );
                })}
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center mt-2">{error}</p>
              )}
            </>
          )}

          {step === "payment" && payment && (
            <>
              {/* Payment Header */}
              <div className="text-center mb-5">
                <h2 className="text-xl font-bold text-white mb-1">Thanh toán chuyển khoản</h2>
                <p className="text-sm text-zinc-400">
                  Gói {selectedPlan?.label} — {formatPrice(payment.amount)}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-5">
                <div className="bg-white rounded-2xl p-3">
                  <img
                    src={({
                      MONTH_1: "/images/QR_CODE_37K.png",
                      MONTH_3: "/images/QR_CODE_99K.png",
                      MONTH_6: "/images/QR_CODE_189K.png",
                      MONTH_12: "/images/QR_CODE_369K.png",
                    } as Record<string, string>)[selectedPlan?.id ?? ""] ?? "/images/QR_CODE_37K.png"}
                    alt="QR Thanh toán"
                    className="w-48 h-48 object-contain"
                  />
                </div>
              </div>

              {/* Bank info */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-5 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Ngân hàng:</span>
                  <span className="text-white font-medium">{payment.bankInfo.bankName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Số tài khoản:</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(payment.bankInfo.accountNumber)}
                    className="text-yellow-400 font-mono font-bold hover:text-yellow-300 flex items-center gap-1"
                  >
                    {payment.bankInfo.accountNumber}
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Chủ tài khoản:</span>
                  <span className="text-white font-medium">{payment.bankInfo.accountHolder}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Số tiền:</span>
                  <span className="text-yellow-400 font-bold">{formatPrice(payment.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Nội dung CK:</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(payment.transferContent)}
                    className="text-green-400 font-mono font-bold hover:text-green-300 flex items-center gap-1"
                  >
                    {payment.transferContent}
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Status indicator */}
              <div className={`text-center p-3 rounded-xl border mb-4 ${
                paymentStatus === "COMPLETED"
                  ? "bg-green-500/10 border-green-500/20"
                  : paymentStatus === "EXPIRED" || paymentStatus === "FAILED"
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-white/[0.03] border-white/[0.06]"
              }`}>
                <p className={`text-lg font-bold ${statusConfig[paymentStatus]?.color || "text-white"}`}>
                  {statusConfig[paymentStatus]?.icon} {statusConfig[paymentStatus]?.text}
                </p>
                {paymentStatus === "PENDING" && timeLeft > 0 && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Còn lại: {formatTime(timeLeft)}
                  </p>
                )}
                {paymentStatus === "COMPLETED" && (
                  <p className="text-xs text-green-300 mt-1">
                    Tài khoản VIP đã được kích hoạt! 🎉
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {(paymentStatus === "EXPIRED" || paymentStatus === "FAILED") && (
                  <button
                    onClick={() => { setStep("plans"); setPayment(null); }}
                    className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl transition-colors"
                  >
                    Thử lại
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className={`py-3 text-zinc-400 hover:text-white font-medium rounded-xl transition-colors ${
                    paymentStatus === "EXPIRED" || paymentStatus === "FAILED" ? "flex-1" : "w-full"
                  }`}
                >
                  {paymentStatus === "COMPLETED" ? "Đóng" : "Hủy bỏ"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
