import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "The Midnight Movie Reel – Truyện Audio, Truyện Chữ Online & Review Phim Hay";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), "public", "logo_phim.png"));
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 40%, #e50914 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <img src={logoBase64} width={180} height={180} style={{ objectFit: "contain", borderRadius: 30, marginBottom: 30 }} />
        <div
          style={{
            fontSize: 64,
            fontWeight: "bold",
            color: "white",
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          The Midnight Movie Reel
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#f59e0b",
            marginBottom: 16,
          }}
        >
          Truyện Audio • Truyện Chữ Online • Review Phim
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#a1a1aa",
          }}
        >
          Nghe truyện, đọc truyện & review phim mỗi ngày
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
