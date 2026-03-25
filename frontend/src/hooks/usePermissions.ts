import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import apiClient from "../utils/api";

interface UsePermissionsReturn {
  permissions: string[];
  isLoading: boolean;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

/**
 * usePermissions — fetches current user's permissions and provides check helpers.
 * ADMIN role always returns true for all permission checks.
 */
export const usePermissions = (): UsePermissionsReturn => {
  const { user, isAuthenticated, accessToken } = useSelector(
    (state: RootState) => state.auth
  );
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setPermissions([]);
      return;
    }

    // ADMIN has all permissions — no need to fetch
    if (isAdmin) {
      setPermissions(["*"]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.get("/auth/me/permissions");
      const data = response.data?.data || response.data;
      setPermissions(data.permissions || []);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken, isAdmin]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (code: string): boolean => {
      if (isAdmin) return true;
      return permissions.includes(code);
    },
    [permissions, isAdmin]
  );

  const hasAnyPermission = useCallback(
    (codes: string[]): boolean => {
      if (isAdmin) return true;
      return codes.some((code) => permissions.includes(code));
    },
    [permissions, isAdmin]
  );

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    refreshPermissions: fetchPermissions,
  };
};
