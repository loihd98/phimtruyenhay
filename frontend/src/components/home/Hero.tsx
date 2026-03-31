"use client";

import React from "react";
import Link from "next/link";

const Hero: React.FC = () => {
  return (
    <div>
      {/* Desktop Hero */}
      <div className="hidden sm:block relative overflow-hidden hero-banner">
        {/* Combined gradient background - single DOM node instead of 4 */}
        <div className="absolute inset-0 hero-gradient" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.04] hero-grid" />

        <div className="relative max-w-[1400px] mx-auto px-4 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                <span className="text-[12px] font-medium text-white/80 tracking-wide uppercase hero-text">Truyện Audio • Truyện Chữ • Review Phim</span>
              </div>

              <h1 className="text-4xl lg:text-[3.5rem] font-bold leading-[1.1] mb-6">
                <span className="text-white hero-text-strong">Nghe truyện, đọc truyện</span>
                <br />
                <span className="bg-gradient-to-r from-primary-500 via-accent-500 to-cinema-purple bg-clip-text text-transparent">& review phim hay</span>
              </h1>

              <p className="text-base text-white/70 mb-8 max-w-lg leading-relaxed hero-text">
                Kho truyện audio đa dạng, truyện chữ online miễn phí và review phim chuyên sâu — từ phim Hollywood, anime đến truyện ma, ngôn tình.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/phim" className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 hover:-translate-y-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
                  Review Phim
                </Link>
                <Link href="/truyen-audio" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 hero-btn">
                  <svg className="w-4 h-4 text-cinema-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                  Truyện Audio
                </Link>
                <Link href="/truyen-text" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 hero-btn">
                  <svg className="w-4 h-4 text-cinema-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                  Kho Truyện
                </Link>
              </div>
            </div>

            {/* Right - Feature grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="group bg-white/[0.06] border border-white/[0.12] rounded-2xl p-5 hover:border-primary-500/40 hover:bg-primary-500/10 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                </div>
                <h3 className="text-white font-semibold text-sm mb-1 hero-text-strong">Truyện Audio</h3>
                <p className="text-white/50 text-xs leading-relaxed hero-text-sub">Nghe truyện ma, trinh thám, ngôn tình</p>
              </div>
              <div className="group bg-white/[0.06] border border-white/[0.12] rounded-2xl p-5 hover:border-accent-500/40 hover:bg-accent-500/10 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                </div>
                <h3 className="text-white font-semibold text-sm mb-1 hero-text-strong">Truyện Chữ</h3>
                <p className="text-white/50 text-xs leading-relaxed hero-text-sub">Đọc truyện online miễn phí</p>
              </div>
              <div className="group bg-white/[0.06] border border-white/[0.12] rounded-2xl p-5 hover:border-cinema-purple/40 hover:bg-cinema-purple/10 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-cinema-purple/20 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-cinema-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
                </div>
                <h3 className="text-white font-semibold text-sm mb-1 hero-text-strong">Review Phim</h3>
                <p className="text-white/50 text-xs leading-relaxed hero-text-sub">Phân tích, giải thích, đánh giá phim</p>
              </div>
              <div className="group bg-white/[0.06] border border-white/[0.12] rounded-2xl p-5 hover:border-cinema-neon/40 hover:bg-cinema-neon/10 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-cinema-neon/20 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-cinema-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
                </div>
                <h3 className="text-white font-semibold text-sm mb-1 hero-text-strong">Thể Loại Đa Dạng</h3>
                <p className="text-white/50 text-xs leading-relaxed hero-text-sub">Ma, trinh thám, ngôn tình & hơn nữa</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Hero */}
      <div className="sm:hidden px-4 pt-4 pb-2">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] p-5 hero-banner">
          {/* Combined gradient background for mobile */}
          <div className="absolute inset-0 hero-gradient rounded-2xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3">
              <div className="w-1 h-1 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider hero-text">Audio • Truyện • Phim</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-1.5 leading-tight hero-text-strong">
              Nghe truyện, đọc truyện & <span className="text-primary-500">review phim</span>
            </h1>
            <p className="text-xs text-white/60 mb-4 hero-text">Truyện audio, truyện chữ online miễn phí và review phim hay</p>

            <div className="grid grid-cols-2 gap-2">
              <Link href="/phim" className="flex items-center gap-2 bg-primary-500/15 border border-primary-500/30 px-3 py-2.5 rounded-xl hover:bg-primary-500/25 transition-colors">
                <svg className="w-4 h-4 text-primary-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
                <span className="text-xs font-semibold text-primary-400">Review Phim</span>
              </Link>
              <Link href="/phim?sort=rating" className="flex items-center gap-2 bg-accent-500/15 border border-accent-500/30 px-3 py-2.5 rounded-xl hover:bg-accent-500/25 transition-colors">
                <svg className="w-4 h-4 text-accent-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span className="text-xs font-semibold text-accent-400">Top Phim</span>
              </Link>
              <Link href="/truyen-audio" className="flex items-center gap-2 bg-cinema-purple/15 border border-cinema-purple/30 px-3 py-2.5 rounded-xl hover:bg-cinema-purple/25 transition-colors">
                <svg className="w-4 h-4 text-cinema-purple shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                <span className="text-xs font-semibold text-purple-400">Audio</span>
              </Link>
              <Link href="/truyen-text" className="flex items-center gap-2 bg-cinema-neon/15 border border-cinema-neon/30 px-3 py-2.5 rounded-xl hover:bg-cinema-neon/25 transition-colors">
                <svg className="w-4 h-4 text-cinema-neon shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                <span className="text-xs font-semibold text-cyan-400">Truyện</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
