// app/layout.tsx (RootLayout - server component)
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "../../styles/globals.css";
import ClientProvider from "./providers";
import ThemeProvider from "@/components/layout/ThemeProvider";
import GoogleAnalytics from "@/components/seo/GoogleAnalytics";
import GoogleAdSense from "@/components/seo/GoogleAdSense";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://phimtruyenhay.com";
const siteName = "Phim Truyện Hay";
const siteDescription =
  "Phim Truyện Hay – Nghe truyện audio hay, đọc truyện chữ online miễn phí và review phim chuyên sâu. Kho truyện audio đa thể loại (tiên hiệp, đô thị, kiếm hiệp, ngôn tình), truyện chữ cập nhật liên tục, cùng đánh giá phim Netflix, phim chiếu rạp mới nhất 2026. Tất cả miễn phí!";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Phim Truyện Hay – Nghe Truyện Audio, Đọc Truyện Online & Review Phim Hay 2026",
    template: "%s | Phim Truyện Hay",
  },
  description: siteDescription,
  keywords: [
    "Phim Truyện Hay",
    "truyện audio",
    "nghe truyện audio",
    "truyện audio hay",
    "truyện audio tiên hiệp",
    "truyện audio đô thị",
    "truyện audio kiếm hiệp",
    "truyện audio ngôn tình",
    "nghe truyện online miễn phí",
    "đọc truyện online",
    "truyện chữ hay",
    "đọc truyện chữ miễn phí",
    "kho truyện miễn phí",
    "truyện tiên hiệp",
    "truyện huyền huyễn",
    "truyện đô thị",
    "review phim",
    "review phim mới",
    "phim hay 2026",
    "đánh giá phim",
    "phim Netflix hay",
    "phim chiếu rạp mới",
    "top phim hay",
    "giải thích phim",
    "ending explained",
    "phân tích phim chuyên sâu",
  ],
  authors: [{ name: "Phim Truyện Hay", url: siteUrl }],
  creator: "Phim Truyện Hay",
  publisher: "Phim Truyện Hay",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    siteName: siteName,
    title: "Phim Truyện Hay – Nghe Truyện Audio, Đọc Truyện Online & Review Phim Hay 2026",
    description: siteDescription,
    images: [
      {
        url: "/logo_phim.png",
        width: 1200,
        height: 630,
        alt: "Phim Truyện Hay – Truyện audio, truyện chữ online và review phim hay",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Phim Truyện Hay – Nghe Truyện Audio, Đọc Truyện Online & Review Phim Hay 2026",
    description: siteDescription,
    images: ["/logo_phim.png"],
    creator: "@PhimTruyenHay",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/logo_phim.png", type: "image/png" },
    ],
    apple: [{ url: "/logo_phim.png", type: "image/png" }],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    // google: 'your-google-verification-code',
  },
  category: "entertainment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f8f9fa" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0f" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Phim Truyện Hay" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Phim Truyện Hay" />
        <link rel="author" href={`${siteUrl}/humans.txt`} />
        {/* Inline script to restore persisted theme before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=JSON.parse(localStorage.getItem('persist:root')||'{}');var u=JSON.parse(p.ui||'{}');if(u.theme==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1838006408938589"
          crossOrigin="anonymous"></script>
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <GoogleAnalytics />
        <GoogleAdSense />
        <ClientProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </ClientProvider>
      </body>
    </html>
  );
}
