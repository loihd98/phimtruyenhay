/**
 * Custom image loader for Next.js.
 *
 * In this Docker deployment nginx serves `/uploads/` directly with
 * aggressive caching (1 year, immutable).  The Next.js image optimizer
 * cannot reliably access volume-mounted files in standalone mode, so
 * we bypass it and let nginx handle image delivery.
 *
 * Static assets imported via `import img from './img.png'` are bundled
 * by webpack at build time and are NOT affected by this loader.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Already a full URL (external images) → return as-is
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  // Upload images served by nginx — return direct path
  // nginx serves with: expires 1y; Cache-Control "public, immutable"
  if (src.startsWith("/uploads/")) {
    return src;
  }

  // Data URIs → return as-is
  if (src.startsWith("data:")) {
    return src;
  }

  // Static assets — use Next.js built-in image optimizer for resizing
  // This handles the logo.png (1.7MB source) served at 34×34 etc.
  const q = quality || 75;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}
