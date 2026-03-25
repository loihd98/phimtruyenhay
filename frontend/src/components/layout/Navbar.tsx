"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { logoutUser } from "../../store/slices/authSlice";
import Link from "next/link";
import Image from "next/image";
import { AppDispatch } from "../../store";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

const Navbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router: any = useRouter();
  const pathName = usePathname();
  const { t } = useLanguage();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, isAdmin, hasAdminAccess, isReady } = useAuth();

  const isStoriesPage = useMemo(() => {
    return (
      pathName?.startsWith("/stories") ||
      pathName?.startsWith("/truyen_text") ||
      pathName?.startsWith("/truyen_audio") ||
      pathName?.startsWith("/the-loai")
    );
  }, [pathName]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
    setIsUserMenuOpen(false);
    router.push("/");
  };

  const handleProfileClick = () => {
    if (hasAdminAccess) {
      router.push("/admin");
    } else {
      router.push("/profile");
    }
    setIsUserMenuOpen(false);
  };

  return (
    <nav className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 ${isMobileMenuOpen ? 'relative' : 'sticky top-0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {/* Logo */}
            <Link
              href="/"
              className="flex-shrink-0 flex items-center group"
            >
              <div className="hidden md:flex items-center text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/khotruyen_logo.png"
                  alt="Kho Truyện Hay"
                  width={36}
                  height={36}
                  className="rounded-lg mr-2"
                  priority
                />
              </div>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden lg:ml-10 lg:flex lg:space-x-1">
              <Link
                href="/"
                className="relative text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-xs font-medium transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
              >
                <span className="relative">
                  {t("nav.home")}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
                </span>
              </Link>
              <Link
                href="/truyen_audio"
                className="relative text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-xs font-medium transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md group"
              >
                <span className="relative">
                  {t("nav.audio")}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
                </span>
              </Link>
              <Link
                href="/film-reviews"
                className="relative text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-xs font-medium transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md group"
              >
                <span className="relative">
                  🎬 Review Phim
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
                </span>
              </Link>
              <Link
                href="/truyen_text"
                className="relative text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-xs font-medium transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md group"
              >
                <span className="relative">
                  {t("nav.stories")}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
                </span>
              </Link>
              {/* <Link
                href="/the-loai"
                className="relative text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-xs font-medium transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md group"
              >
                <span className="relative">
                  {t("nav.genres")}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
                </span>
              </Link> */}
              {/* Search icon - Desktop */}
              {!isStoriesPage && (
                <Link
                  href="/truyen_audio"
                  className="p-2 rounded-lg text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 flex items-center"
                  title="Tìm kiếm"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </Link>
              )}
            </div>
          </div>
          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 flex items-center ml-4 md:ml-0 group"
          >
            <div className="flex sm:hidden items-center text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/khotruyen_logo.png"
                alt="Kho Truyện Hay"
                width={32}
                height={32}
                className="rounded-lg mr-2"
                priority
              />
              khotruyen.vn
            </div>
          </Link>

          {/* Hamburger button - Mobile only */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => { if (!isMobileMenuOpen) window.scrollTo({ top: 0, behavior: 'instant' }); setIsMobileMenuOpen(!isMobileMenuOpen); }}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Right side - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">

            {!isReady ? (
              // Loading state while auth is initializing
              <div className="flex items-center space-x-3">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded"></div>
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded"></div>
              </div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                {/* Bookmarks */}
                <Link
                  href="/bookmarks"
                  className="group p-3 rounded-xl text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-lg hover:scale-110 transform"
                  title="Bookmarks"
                >
                  <svg
                    className="h-5 w-5 group-hover:scale-110 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </Link>

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 transition-colors duration-200"
                  >
                    {user.avatar ? (
                      <img
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500"
                        src={user.avatar}
                        alt={user.name}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium ring-2 ring-blue-500">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <svg
                      className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""
                        }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        {/* Menu Items */}
                        <button
                          onClick={handleProfileClick}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-3"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span>
                            {hasAdminAccess ? t("nav.admin") : t("nav.profile")}
                          </span>
                        </button>

                        <Link
                          href="/bookmarks"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                              />
                            </svg>
                            <span>{t("nav.bookmarks")}</span>
                          </div>
                        </Link>

                        <Link
                          href="/settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span>{t("nav.settings")}</span>
                          </div>
                        </Link>

                        <div className="border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 transition-colors duration-200 flex items-center space-x-3"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            <span>{t("auth.logout")}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin link */}
                {hasAdminAccess && (
                  <Link
                    href="/admin"
                    className="group relative text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:shadow-md hover:scale-105"
                  >
                    <span className="flex items-center gap-2">⚙️ Admin</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  </Link>
                )}

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="group relative text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 hover:shadow-md hover:scale-105"
                >
                  <span className="flex items-center gap-2">
                    🚪 {t("nav.logout")}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="group relative text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:shadow-md hover:scale-105 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                >
                  <span className="flex items-center gap-2">
                    🔑 {t("nav.login")}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </Link>
                <Link
                  href="/auth/register"
                  className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  <span className="flex items-center gap-2">
                    ✨ {t("nav.register")}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-blue-100 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu - toggleable hamburger dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">

            {/* Featured 3 categories block */}
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Khám phá</p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/truyen_text"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <span className="text-2xl">📚</span>
                  <div>
                    <div className="font-semibold text-sm">{t("nav.stories")}</div>
                    <div className="text-xs text-blue-500 dark:text-blue-400">Đọc truyện chữ</div>
                  </div>
                </Link>
                <Link
                  href="/truyen_audio"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                >
                  <span className="text-2xl">🎧</span>
                  <div>
                    <div className="font-semibold text-sm">{t("nav.audio")}</div>
                    <div className="text-xs text-purple-500 dark:text-purple-400">Nghe truyện audio</div>
                  </div>
                </Link>
                <Link
                  href="/film-reviews"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                >
                  <span className="text-2xl">🎬</span>
                  <div>
                    <div className="font-semibold text-sm">Review Phim</div>
                    <div className="text-xs text-rose-500 dark:text-rose-400">Đánh giá phim hay</div>
                  </div>
                </Link>
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <span className="text-2xl">🏠</span>
                  <div>
                    <div className="font-semibold text-sm">Trang chủ</div>
                    <div className="text-xs text-blue-500 dark:text-blue-400">Về trang chủ</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-gray-700 mx-4 my-2" />

            {/* Auth row */}
            <div className="px-4 pb-4 flex items-center gap-2">
              {isReady && isAuthenticated && user ? (
                <>
                  <Link
                    href="/bookmarks"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    🔖 {t("nav.bookmarks")}
                  </Link>
                  {hasAdminAccess && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      ⚙️ Admin
                    </Link>
                  )}
                  <button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="px-3 py-1.5 rounded-full text-sm font-medium text-red-500 dark:text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    🚪 {t("nav.logout")}
                  </button>
                </>
              ) : isReady ? (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    🔑 {t("nav.login")}
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    ✨ {t("nav.register")}
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        )
        }
      </div>
    </nav>
  );
};

export default Navbar;
