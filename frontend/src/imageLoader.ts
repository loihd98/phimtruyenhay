export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width?: number;
  quality?: number;
}) {
  // 1. External URLs — return as-is
  if (src.startsWith("http")) return src;

  // 2. Data URIs
  if (src.startsWith("data:")) return src;

  // 3. Uploads (Nginx handles these with aggressive caching)
  //    Width/quality params are included for future CDN/image-proxy readiness
  if (src.startsWith("/uploads/")) {
    return src;
  }

  // 4. Static Assets (Logo, Icons, etc.)
  return src;
}
