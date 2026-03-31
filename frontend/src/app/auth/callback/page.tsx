"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { setAccessToken, getProfile } from "@/store/slices/authSlice";
import { AppDispatch } from "@/store";
import Layout from "@/components/layout/Layout";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get("token");

    if (token) {
      // Store the access token in Redux
      dispatch(setAccessToken(token));
      // Fetch user profile with the new token
      dispatch(getProfile())
        .unwrap()
        .then((user: any) => {
          const role = user?.role;
          if (role === "ADMIN" || role === "EDITOR") {
            router.replace("/admin");
          } else {
            router.replace("/");
          }
        })
        .catch(() => {
          router.replace("/");
        });
    } else {
      router.replace("/auth/login?error=no_token");
    }
  }, [searchParams, dispatch, router]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400 text-sm">Đang xác thực tài khoản...</p>
        </div>
      </div>
    </Layout>
  );
}
