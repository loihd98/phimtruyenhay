// app/layout.tsx (RootLayout - server component)
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "../../styles/globals.css";
import ClientProvider from "./providers";
import ThemeProvider from "@/components/layout/ThemeProvider";
import GoogleAnalytics from "@/components/seo/GoogleAnalytics";
import GoogleAdSense from "@/components/seo/GoogleAdSense";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://themidnightmoviereel.io.vn";
const siteName = "The Midnight Movie Reel";
const siteDescription =
  "Khám phá thế giới điện ảnh cùng The Midnight Movie Reel – website review phim, phân tích nội dung chuyên sâu, giải thích ending và gợi ý phim hay mỗi ngày. Từ phim Hollywood, Netflix đến phim indie, chúng tôi mang đến góc nhìn chân thực và chuyên sâu. Ngoài ra còn có kho truyện audio và truyện chữ đa dạng thể loại.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "The Midnight Movie Reel – Review Phim Hay, Phân Tích Điện Ảnh Chuyên Sâu",
    template: "%s | The Midnight Movie Reel",
  },
  description: siteDescription,
  keywords: [
    "The Midnight Movie Reel",
    "review phim",
    "review phim mới",
    "phim hay 2026",
    "đánh giá phim",
    "giải thích phim",
    "ending explained",
    "phim Netflix hay",
    "phim chiếu rạp mới",
    "phim đáng xem",
    "top phim hay",
    "review phim không spoiler",
    "phim kinh dị hay nhất",
    "phim hành động",
    "phim tình cảm",
    "phim anime hay",
    "phân tích phim",
    "giải mã ending phim",
    "top phim Netflix",
    "top phim mind-blowing",
    "truyện audio",
    "truyện audio hay",
    "nghe truyện audio",
    "đọc truyện online",
    "truyện chữ hay",
    "kho truyện miễn phí",
  ],
  authors: [{ name: "The Midnight Movie Reel", url: siteUrl }],
  creator: "The Midnight Movie Reel",
  publisher: "The Midnight Movie Reel",
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
    title: "The Midnight Movie Reel – Review Phim Hay, Phân Tích Điện Ảnh Chuyên Sâu",
    description: siteDescription,
    images: [
      {
        url: "/logo_phim.png",
        width: 1200,
        height: 630,
        alt: "The Midnight Movie Reel – Review phim, phân tích điện ảnh chuyên sâu",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Midnight Movie Reel – Review Phim Hay, Phân Tích Điện Ảnh Chuyên Sâu",
    description: siteDescription,
    images: ["/logo_phim.png"],
    creator: "@MidnightMovieReel",
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
    <html lang="vi" suppressHydrationWarning className="dark">
      <head>
        <meta name="theme-color" content="#e50914" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Midnight Movie Reel" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="The Midnight Movie Reel" />
        <link rel="author" href={`${siteUrl}/humans.txt`} />
        {/* Inline script to restore persisted theme before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=JSON.parse(localStorage.getItem('persist:root')||'{}');var u=JSON.parse(p.ui||'{}');if(u.theme==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})();`,
          }}
        />
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
