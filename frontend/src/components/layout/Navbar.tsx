"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { logoutUser } from "../../store/slices/authSlice";
import Link from "next/link";
import Image from "next/image";
import { AppDispatch } from "../../store";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/layout/ThemeProvider";

const Navbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router: any = useRouter();
  const pathName = usePathname();
  const { t } = useLanguage();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { user, isAuthenticated, isAdmin, hasAdminAccess, isReady } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isStoriesPage = useMemo(() => {
    return (
      pathName?.startsWith("/stories") ||
      pathName?.startsWith("/truyen-text") ||
      pathName?.startsWith("/truyen-audio") ||
      pathName?.startsWith("/the-loai")
    );
  }, [pathName]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isSearchOpen]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setIsSearchOpen(true); }
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
    setIsUserMenuOpen(false);
    router.push("/");
  };

  const handleProfileClick = () => {
    router.push(hasAdminAccess ? "/admin" : "/profile");
    setIsUserMenuOpen(false);
  };

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/phim?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  }, [searchQuery, router]);

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/phim", label: "Review Phim" },
    { href: "/blog", label: "Blog" },
    { href: "/truyen-audio", label: t("nav.audio") },
    { href: "/truyen-text", label: t("nav.stories") },
    { href: "/the-loai", label: "Thể loại" },
  ];

  const isActive = (href: string) => (href === "/" ? pathName === "/" : pathName?.startsWith(href));

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-[#08080d]/95 backdrop-blur-xl shadow-lg shadow-black/20 border-b border-white/[0.04]" : "bg-transparent"}`}>
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <Image src="/logo_phim.png" alt="The Midnight Movie Reel" width={34} height={34} className="rounded-lg group-hover:rotate-[-4deg] transition-transform duration-300" priority />
              <div>
                <span className="text-[15px] font-bold tracking-tight">
                  <span className="text-white/90">MIDNIGHT</span>
                  <span className="text-primary-500 ml-1">REEL</span>
                </span>
              </div>
            </Link>

            {/* Center nav - Desktop */}
            <div className="hidden lg:flex items-center gap-1 bg-white/[0.04] rounded-full px-1.5 py-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={`relative px-4 py-1.5 text-[13px] font-medium rounded-full transition-all duration-200 ${isActive(link.href) ? "bg-primary-500 text-white shadow-md shadow-primary-500/20" : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"}`}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-zinc-500 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] transition-all duration-200 text-[13px] dark:text-zinc-500 dark:hover:text-white dark:bg-white/[0.03] dark:hover:bg-white/[0.06]" aria-label="Tìm kiếm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <span className="hidden md:inline">Tìm kiếm</span>
                <kbd className="hidden md:inline text-[10px] text-zinc-600 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">⌘K</kbd>
              </button>

              {/* Dark mode toggle */}
              <button onClick={toggleTheme} className="p-2 rounded-full text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] dark:text-zinc-400 dark:hover:text-white transition-all duration-200" aria-label="Toggle theme">
                {theme === "dark" ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
                )}
              </button>

              {/* Desktop auth */}
              <div className="hidden lg:flex items-center gap-2">
                {!isReady ? (
                  <div className="animate-pulse bg-white/5 h-8 w-20 rounded-full" />
                ) : isAuthenticated && user ? (
                  <>
                    <Link href="/bookmarks" className="p-2 rounded-full text-zinc-400 hover:text-accent-400 hover:bg-accent-500/10 transition-all" title="Bookmarks">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                      </svg>
                    </Link>
                    {hasAdminAccess && (
                      <Link href="/admin" className="p-2 rounded-full text-zinc-400 hover:text-accent-400 hover:bg-accent-500/10 transition-all" title="Admin">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Link>
                    )}
                    <div className="relative" ref={userMenuRef}>
                      <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 p-1 rounded-full hover:bg-white/[0.06] transition-all">
                        {user.avatar ? (
                          <img className="h-8 w-8 rounded-full object-cover ring-2 ring-white/10" src={user.avatar} alt={user.name} />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-cinema-purple flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/10">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </button>
                      {isUserMenuOpen && (
                        <div className="absolute right-0 mt-3 w-52 rounded-2xl bg-[#141420] border border-white/[0.06] shadow-2xl shadow-black/40 overflow-hidden">
                          <div className="px-4 py-3 border-b border-white/[0.04]">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                          </div>
                          <div className="py-1">
                            <button onClick={handleProfileClick} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.04] hover:text-white transition-colors flex items-center gap-3">
                              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                              {hasAdminAccess ? t("nav.admin") : t("nav.profile")}
                            </button>
                            <Link href="/bookmarks" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.04] hover:text-white transition-colors flex items-center gap-3">
                              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
                              {t("nav.bookmarks")}
                            </Link>
                          </div>
                          <div className="border-t border-white/[0.04] py-1">
                            <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                              {t("auth.logout")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="text-[13px] font-medium text-zinc-400 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.06] transition-all">{t("nav.login")}</Link>
                    <Link href="/auth/register" className="text-[13px] font-medium text-white bg-primary-500 hover:bg-primary-600 px-5 py-2 rounded-full transition-all shadow-lg shadow-primary-500/20">{t("nav.register")}</Link>
                  </>
                )}
              </div>

              {/* Mobile bookmark icon */}
              {isReady && isAuthenticated && (
                <Link href="/bookmarks" className="lg:hidden p-2 rounded-full text-zinc-400 hover:text-accent-400 hover:bg-accent-500/10 transition-all" title="Bookmarks">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                </Link>
              )}

              {/* Hamburger */}
              <button onClick={() => { if (!isMobileMenuOpen) window.scrollTo({ top: 0, behavior: "instant" }); setIsMobileMenuOpen(!isMobileMenuOpen); }} className="lg:hidden p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all" aria-label="Menu">
                {isMobileMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search overlay */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#0c0c14]/98 backdrop-blur-xl border-b border-white/[0.04] shadow-2xl">
            <div className="max-w-2xl mx-auto px-4 py-5">
              <form onSubmit={handleSearch} className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm review phim, truyện audio, truyện chữ..." className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm" />
                <button type="button" onClick={() => setIsSearchOpen(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs bg-white/[0.06] px-2 py-1 rounded-lg">ESC</button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[11px] text-zinc-600">Gợi ý:</span>
                {["Phim hay 2026", "Ending explained", "Truyện audio", "Top IMDB"].map((tag) => (
                  <button key={tag} onClick={() => { setSearchQuery(tag); router.push(`/phim?search=${encodeURIComponent(tag)}`); setIsSearchOpen(false); }} className="text-[11px] text-zinc-500 hover:text-primary-400 bg-white/[0.03] hover:bg-primary-500/10 border border-white/[0.04] px-2.5 py-1 rounded-full transition-all">{tag}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#0c0c14]/98 backdrop-blur-xl border-t border-white/[0.04] max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive(link.href) ? "bg-primary-500/10 text-primary-400 border border-primary-500/20" : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"}`}>
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-white/[0.04] px-4 py-4">
              {isReady && isAuthenticated && user ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-4 py-3">
                    {user.avatar ? (
                      <img className="h-9 w-9 rounded-full object-cover ring-2 ring-white/10" src={user.avatar} alt={user.name} />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-cinema-purple flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/10">{user.name.charAt(0).toUpperCase()}</div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-zinc-500">{user.role}</p>
                    </div>
                  </div>
                  <Link href="/bookmarks" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors">Bookmarks</Link>
                  {hasAdminAccess && <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors">Admin Panel</Link>}
                  <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">{t("auth.logout")}</button>
                </div>
              ) : isReady ? (
                <div className="flex gap-2">
                  <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 text-center text-sm font-medium text-zinc-300 py-2.5 rounded-xl border border-white/[0.06] hover:bg-white/[0.04] transition-colors">{t("nav.login")}</Link>
                  <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 text-center text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 py-2.5 rounded-xl transition-colors">{t("nav.register")}</Link>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </nav>
      <div className="h-16" />
    </>
  );
};

export default Navbar;
