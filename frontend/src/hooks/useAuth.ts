import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";

/**
 * Main auth hook - provides complete auth state and helper functions
 * NOTE: refreshToken is no longer in state — it's an httpOnly cookie
 */
export const useAuth = () => {
  const [isReady, setIsReady] = useState(false);
  const auth = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Wait a bit to ensure rehydration is complete
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return {
    ...auth,
    isReady,
    isAdmin: auth.user?.role === "ADMIN",
    isEditor: auth.user?.role === "EDITOR",
    isPremium: auth.user?.role === "PREMIUM",
    isUser: auth.user?.role === "USER",
    hasAdminAccess: ["ADMIN", "EDITOR"].includes(auth.user?.role || ""),
  };
};

/**
 * Custom hook to get auth headers for API calls
 * Uses Redux state instead of localStorage
 */
export const useAuthHeaders = () => {
  const { accessToken } = useSelector((state: RootState) => state.auth);

  return {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    hasToken: !!accessToken,
  };
};

/**
 * Custom hook to get just the access token
 */
export const useAccessToken = () => {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  return accessToken;
};
