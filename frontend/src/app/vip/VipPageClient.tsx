"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useVip } from "@/hooks/useVip";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { fetchVipStatus } from "@/store/slices/vipSlice";
import VipUpgradeModal from "@/components/vip/VipUpgradeModal";
import Link from "next/link";

const VIP_PLAN_LABELS: Record<string, string> = {
  MONTH_1: "1 Tháng",
  MONTH_3: "3 Tháng",
  MONTH_6: "6 Tháng",
  MONTH_12: "12 Tháng",
};

const BENEFITS = [
  {
    icon: "🚫",
    title: "Không quảng cáo",
    desc: "Trải nghiệm đọc/nghe truyện hoàn toàn không có popup ủng hộ hay quảng cáo gián đoạn.",
  },
  {
    icon: "🎧",
    title: "Audio chất lượng cao",
    desc: "Nghe truyện audio với chất lượng âm thanh tốt nhất, không giới hạn băng thông.",
  },
  {
    icon: "📚",
    title: "Toàn bộ thư viện",
    desc: "Truy cập không giới hạn toàn bộ kho truyện và phim review trên hệ thống.",
  },
  {
    icon: "⚡",
    title: "Xem trước tập mới",
    desc: "Đọc/nghe các chương mới được đăng sớm hơn người dùng thường.",
  },
  {
    icon: "👑",
    title: "Huy hiệu VIP",
    desc: "Hiển thị huy hiệu VIP đặc biệt trên avatar của bạn trong toàn bộ hệ thống.",
  },
  {
    icon: "💬",
    title: "Hỗ trợ ưu tiên",
    desc: "Được giải quyết mọi vấn đề, yêu cầu nhanh hơn qua kênh hỗ trợ VIP riêng.",
  },
];

export default function VipPageClient() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isReady, user } = useAuth();
  const { isVip, subscription, isLoading } = useVip();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      dispatch(fetchVipStatus());
    }
  }, [isReady, isAuthenticated, dispatch]);

  const handleSuccess = () => {
    setShowModal(false);
    dispatch(fetchVipStatus());
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const getDaysLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="min-h-screen bg-[#08080d]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 via-orange-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium mb-6">
            <span>👑</span>
            <span>Thành viên VIP</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Trải nghiệm{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              không giới hạn
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Nâng cấp VIP để đọc & nghe truyện không quảng cáo, chất lượng tốt nhất với giá cực kỳ hợp lý.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-20">
        {/* VIP Status card — show only when logged in */}
        {isReady && isAuthenticated && (
          <div className="mb-10">
            {isLoading ? (
              <div className="h-32 rounded-3xl bg-white/[0.03] animate-pulse" />
            ) : isVip && subscription ? (
              <div className="relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-transparent p-6 md:p-8">
                <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative flex flex-col md:flex-row md:items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border border-yellow-500/30 flex items-center justify-center text-4xl shrink-0">
                    👑
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-white">
                        Tài khoản VIP đang hoạt động
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-zinc-400 text-sm">
                      Gói{" "}
                      <span className="text-yellow-400 font-medium">
                        {VIP_PLAN_LABELS[subscription.plan] ?? subscription.plan}
                      </span>{" "}
                      · Hết hạn{" "}
                      <span className="text-white font-medium">
                        {formatDate(subscription.endDate)}
                      </span>
                    </p>
                    <p className="text-zinc-500 text-xs mt-1">
                      Còn lại{" "}
                      <span className="text-yellow-400 font-semibold">
                        {getDaysLeft(subscription.endDate)} ngày
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(true)}
                    className="shrink-0 px-5 py-2.5 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 font-medium text-sm transition-all"
                  >
                    Gia hạn VIP
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
                <p className="text-zinc-400 text-sm">
                  Bạn chưa có gói VIP.{" "}
                  <span className="text-yellow-400 font-medium">
                    Đăng ký ngay bên dưới!
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Not logged in CTA */}
        {isReady && !isAuthenticated && (
          <div className="mb-10 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
            <p className="text-zinc-400 mb-4">
              Bạn cần đăng nhập để đăng ký VIP.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </div>
        )}

        {/* Benefits grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Quyền lợi thành viên VIP
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors"
              >
                <div className="text-3xl mb-3">{b.icon}</div>
                <h3 className="text-white font-semibold mb-1.5">{b.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA button */}
        {isReady && isAuthenticated && !isVip && (
          <div className="text-center">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-lg transition-all shadow-xl shadow-yellow-500/20 active:scale-95"
            >
              <span>👑</span>
              Nâng cấp VIP ngay
            </button>
            <p className="text-zinc-600 text-xs mt-3">
              Thanh toán an toàn qua chuyển khoản ngân hàng · Kích hoạt trong vài phút
            </p>
          </div>
        )}

        {/* Renew CTA for VIP users */}
        {isReady && isAuthenticated && isVip && (
          <div className="text-center">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 hover:from-yellow-500/30 hover:to-orange-500/30 font-bold text-base transition-all"
            >
              <span>🔄</span>
              Gia hạn thêm
            </button>
            <p className="text-zinc-600 text-xs mt-3">
              Thời gian gia hạn sẽ được cộng dồn vào ngày hết hạn hiện tại
            </p>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-white text-center mb-6">
            Câu hỏi thường gặp
          </h2>
          <div className="space-y-3">
            {[
              {
                q: "Thanh toán như thế nào?",
                a: "Bạn chuyển khoản ngân hàng theo thông tin QR code hiển thị sau khi chọn gói. Admin sẽ xác nhận và kích hoạt VIP trong vòng vài phút.",
              },
              {
                q: "VIP có hiệu lực ngay không?",
                a: "Sau khi admin xác nhận giao dịch, tài khoản VIP sẽ được kích hoạt tức thì và trang sẽ tự động cập nhật không cần F5.",
              },
              {
                q: "Gia hạn có mất thời gian còn lại không?",
                a: "Không. Thời gian gia hạn được cộng dồn vào ngày hết hạn hiện tại, không bị mất ngày nào.",
              },
              {
                q: "Có hoàn tiền không?",
                a: "Do tính chất dịch vụ số, chúng mình không hỗ trợ hoàn tiền sau khi kích hoạt VIP. Hãy cân nhắc kỹ trước khi đăng ký.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
              >
                <h3 className="text-white font-semibold mb-1.5 text-sm">
                  {faq.q}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      <VipUpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
