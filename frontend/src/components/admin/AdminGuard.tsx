"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

interface AdminGuardProps {
  children: React.ReactNode;
}

const ADMIN_ROLES = ["ADMIN", "EDITOR"];

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const hasAdminAccess = user?.role ? ADMIN_ROLES.includes(user.role) : false;

  useEffect(() => {
    // Wait for auth state to load
    if (isLoading) return;

    // Check if user is not authenticated
    if (!isAuthenticated || !user) {
      toast.error("Bạn cần đăng nhập để truy cập trang admin");
      router.replace("/");
      return;
    }

    // Check if user has admin access role
    if (!hasAdminAccess) {
      toast.error("Bạn không có quyền truy cập trang admin");
      router.replace("/");
      return;
    }
  }, [isAuthenticated, user, isLoading, hasAdminAccess, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Đang kiểm tra quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated or doesn't have admin access
  if (!isAuthenticated || !user || !hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Truy cập bị từ chối
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Bạn không có quyền truy cập trang này
          </p>
          <button
            onClick={() => router.replace("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Render admin content for authenticated admin users
  return <>{children}</>;
};

export default AdminGuard;
