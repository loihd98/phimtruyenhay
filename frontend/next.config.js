/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  output: "standalone",

  experimental: {
    serverComponentsExternalPackages: ["sharp"],
  },

  images: {
    // Custom loader bypasses _next/image optimizer — nginx serves
    // /uploads/ directly with aggressive caching.  This avoids the
    // 400 errors caused by standalone mode not being able to read
    // volume-mounted files.
    loaderFile: "./src/imageLoader.ts",
    formats: ["image/avif", "image/webp"],
    // minimumCacheTTL not needed with custom loader
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  },
  async rewrites() {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const baseUrl = apiUrl.replace("/api", "");

    return [
      // NOTE: /uploads/ is intentionally NOT rewritten here.
      // In production, nginx serves /uploads/ directly (location ^~ /uploads/).
      // In the frontend container, uploads are also mounted at public/uploads/
      // so Next.js static-file serving handles any fallback requests.
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
      {
        source: "/r/:path*",
        destination: `${baseUrl}/r/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${baseUrl}/media/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      // Old URL redirects for SEO
      {
        source: "/truyen_audio",
        destination: "/truyen-audio",
        permanent: true,
      },
      {
        source: "/truyen_audio/:path*",
        destination: "/truyen-audio/:path*",
        permanent: true,
      },
      {
        source: "/truyen_text",
        destination: "/truyen-text",
        permanent: true,
      },
      {
        source: "/truyen_text/:path*",
        destination: "/truyen-text/:path*",
        permanent: true,
      },
      {
        source: "/film-reviews",
        destination: "/phim",
        permanent: true,
      },
      {
        source: "/film-reviews/:path*",
        destination: "/phim/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
