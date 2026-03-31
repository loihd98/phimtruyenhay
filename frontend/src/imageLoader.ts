export default function imageLoader({ src }: { src: string }) {
  // 1. External URLs
  if (src.startsWith("http")) return src;

  // 2. Uploads (Nginx handles these)
  if (src.startsWith("/uploads/")) return src;

  // 3. Data URIs
  if (src.startsWith("data:")) return src;

  // 4. Static Assets (Logo, Icons, etc.)
  // Just return the src. Next.js will provide the hashed path
  // e.g., /_next/static/media/logo.58618447.png
  return src;
}
