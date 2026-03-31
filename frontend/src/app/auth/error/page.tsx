"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/layout/Layout";

export default function OAuthErrorPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "Đăng nhập không thành công. Vui lòng thử lại.";

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Xác thực thất bại</h2>
            <p className="mt-2 text-sm text-zinc-500">{message}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/login" className="px-6 py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-all">
              Thử lại
            </Link>
            <Link href="/" className="px-6 py-2.5 text-sm font-medium text-zinc-400 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl transition-all">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
