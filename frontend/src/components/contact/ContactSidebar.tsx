"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarLinks = [
  {
    icon: "📧",
    label: "Gửi tin nhắn",
    href: "/contact",
    description: "Form liên hệ",
  },
  {
    icon: "📖",
    label: "Truyện Audio",
    href: "/truyen-audio",
    description: "Nghe truyện online",
  },
  {
    icon: "📝",
    label: "Truyện Chữ",
    href: "/truyen-text",
    description: "Đọc truyện online",
  },
  {
    icon: "🎬",
    label: "Review Phim",
    href: "/phim",
    description: "Xem review phim",
  },
  {
    icon: "📰",
    label: "Blog",
    href: "/blog",
    description: "Bài viết mới",
  },
  {
    icon: "👑",
    label: "VIP",
    href: "/vip",
    description: "Nâng cấp tài khoản",
  },
  {
    icon: "🏠",
    label: "Trang chủ",
    href: "/",
    description: "Về trang chủ",
  },
];

export default function ContactSidebar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sticky top-24">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-3">
        Menu
      </h3>
      <ul className="space-y-1">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-primary-500/10 text-primary-400 border border-primary-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <span className="text-base">{link.icon}</span>
                <div>
                  <p className={`font-medium ${isActive ? "text-primary-400" : ""}`}>
                    {link.label}
                  </p>
                  <p className="text-[11px] text-zinc-600">{link.description}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Contact info compact */}
      <div className="mt-6 pt-4 border-t border-white/[0.06] px-3">
        <p className="text-xs text-zinc-500 mb-2">Liên hệ nhanh:</p>
        <a
          href="mailto:hideonstorms@gmail.com"
          className="text-xs text-primary-400 hover:text-primary-300 transition-colors break-all"
        >
          hideonstorms@gmail.com
        </a>
      </div>
    </nav>
  );
}
