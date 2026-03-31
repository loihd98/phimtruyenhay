import React from "react";
import Link from "next/link";
import Image from "next/image";

const Footer: React.FC = () => {
  const contentLinks = [
    { href: "/phim", label: "Review Phim" },
    { href: "/phim?sort=rating", label: "Top Phim Hay" },
    { href: "/truyen-audio", label: "Truyện Audio" },
    { href: "/truyen-text", label: "Truyện Chữ" },
    { href: "/the-loai", label: "Thể loại" },
  ];

  const supportLinks = [
    { href: "/help", label: "Trợ giúp" },
    { href: "/contact", label: "Liên hệ" },
    { href: "/privacy", label: "Bảo mật" },
    { href: "/terms", label: "Điều khoản" },
    { href: "/dmca", label: "DMCA" },
  ];

  return (
    <footer className="relative bg-[#08080d] border-t border-white/[0.04]">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        {/* Top section - CTA banner */}
        <div className="py-10 border-b border-white/[0.04]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-white">Ủng hộ website duy trì & phát triển</h3>
              <p className="text-sm text-zinc-500 mt-1">Mọi đóng góp giúp chúng tôi cập nhật thêm review hay mỗi ngày</p>
            </div>
            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
              <Image src="/qr.jpg" alt="QR ủng hộ" width={72} height={72} className="rounded-xl" />
              <div className="text-sm">
                <p className="text-zinc-400">Ngân hàng <span className="text-white font-semibold">ACB</span></p>
                <p className="text-lg font-mono font-bold text-accent-400 mt-0.5">19036367410014</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">Quét QR hoặc chuyển khoản</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main footer content */}
        <div className="py-10 grid grid-cols-2 md:grid-cols-12 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[15px] font-bold tracking-tight">
                <span className="text-white/90">MIDNIGHT</span>
                <span className="text-primary-500 ml-1">REEL</span>
              </span>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed max-w-xs">
              Review phim chuyên sâu, dễ hiểu. Phân tích nội dung, giải thích ending & gợi ý phim hay.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="#" className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" /></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.37-6.42V9.17a8.16 8.16 0 0 0 3.85.96V6.69z" /></svg>
              </a>
            </div>
          </div>

          {/* Content links */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Nội dung</h4>
            <ul className="space-y-2.5">
              {contentLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-zinc-500 hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Hỗ trợ</h4>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-zinc-500 hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / mini CTA */}
          <div className="col-span-2 md:col-span-4">
            <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Khám phá</h4>
            <div className="space-y-3">
              <Link href="/phim" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 group-hover:bg-primary-500/20 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" /></svg>
                </div>
                <div>
                  <p className="text-[13px] text-white group-hover:text-primary-400 transition-colors">Review phim mới nhất</p>
                  <p className="text-[11px] text-zinc-600">Cập nhật hàng ngày</p>
                </div>
              </Link>
              <Link href="/truyen-audio" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-cinema-purple/10 border border-cinema-purple/20 flex items-center justify-center text-cinema-purple group-hover:bg-cinema-purple/20 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                </div>
                <div>
                  <p className="text-[13px] text-white group-hover:text-cinema-purple transition-colors">Nghe truyện audio</p>
                  <p className="text-[11px] text-zinc-600">Chất lượng cao</p>
                </div>
              </Link>
              <Link href="/truyen-text" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-cinema-neon/10 border border-cinema-neon/20 flex items-center justify-center text-cinema-neon group-hover:bg-cinema-neon/20 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                </div>
                <div>
                  <p className="text-[13px] text-white group-hover:text-cinema-neon transition-colors">Đọc truyện chữ</p>
                  <p className="text-[11px] text-zinc-600">Đa dạng thể loại</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-5 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-zinc-600">&copy; {new Date().getFullYear()} The Midnight Movie Reel</p>
          <div className="flex items-center gap-4">
            <a href="/sitemap.xml" className="text-[12px] text-zinc-600 hover:text-zinc-400 transition-colors">Sitemap</a>
            <span className="text-zinc-800">|</span>
            <Link href="/privacy" className="text-[12px] text-zinc-600 hover:text-zinc-400 transition-colors">Bảo mật</Link>
            <span className="text-zinc-800">|</span>
            <Link href="/terms" className="text-[12px] text-zinc-600 hover:text-zinc-400 transition-colors">Điều khoản</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
