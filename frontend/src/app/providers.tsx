"use client";

import { Provider } from "react-redux";
import { useEffect } from "react";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "react-hot-toast";
import { store, persistor } from "../store";
import { setTokenHandlers } from "../utils/api";
import { clearAuth, refreshToken } from "../store/slices/authSlice";
import { getBookmarks } from "../store/slices/bookmarkSlice";
import { fetchVipStatus } from "../store/slices/vipSlice";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Set up token handlers for API client
    setTokenHandlers(
      // getAuthToken — reads accessToken from memory (Redux store)
      () => {
        const state = store.getState();
        return state.auth.accessToken;
      },
      // handleTokenRefresh — calls /auth/refresh (cookie sent automatically)
      async () => {
        try {
          const result = await store.dispatch(refreshToken());
          if (refreshToken.fulfilled.match(result)) {
            const state = store.getState();
            return state.auth.accessToken;
          }
          return null;
        } catch (error) {
          return null;
        }
      },
      // handleLogout
      () => {
        store.dispatch(clearAuth());
      }
    );

    // Validate auth on app startup by always attempting a silent refresh.
    // The httpOnly refresh-token cookie is sent automatically.
    // If the cookie is valid the user is silently logged back in;
    // if not, the request simply fails and the user stays logged out.
    // We intentionally do NOT gate this on Redux state so that clearing
    // localStorage (Ctrl+Shift+Del) no longer breaks authentication.
    const validateAuth = () => {
      store
        .dispatch(refreshToken())
        .then((result) => {
          if (refreshToken.fulfilled.match(result)) {
            store.dispatch(getBookmarks());
            store.dispatch(fetchVipStatus());
          }
          // If rejected the user is not authenticated — that's fine.
        })
        .catch(() => {
          // Network error or similar — ignore, user stays logged out.
        });
    };

    // Wait for persist gate to rehydrate, then validate
    setTimeout(validateAuth, 500);
  }, []);

  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Đang tải trang">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <span className="sr-only">Đang tải...</span>
          </div>
        }
        persistor={persistor}
      >
        <LanguageProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "14px",
                maxWidth: "400px",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#4aed88",
                  secondary: "#fff",
                },
                style: {
                  background: "#10b981",
                  color: "#fff",
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
                style: {
                  background: "#ef4444",
                  color: "#fff",
                },
              },
            }}
          />
        </LanguageProvider>
      </PersistGate>
    </Provider>
  );
}
