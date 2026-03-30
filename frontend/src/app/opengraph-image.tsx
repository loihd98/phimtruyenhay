import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "Vi Vu Truyện Hay – Nghe Truyện Audio, Đọc Truyện Online Và Xem Phim Hay Mỗi Ngày";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), "public", "khotruyen_logo.png"));
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <img src={logoBase64} width={200} height={200} style={{ objectFit: "contain", borderRadius: 30, marginBottom: 30 }} />
        <div
          style={{
            fontSize: 80,
            fontWeight: "bold",
            color: "white",
            marginBottom: 20,
          }}
        >
          Vi Vu Truyện Hay
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#dbeafe",
            marginBottom: 20,
          }}
        >
          Nghe Truyện Audio • Đọc Truyện Online • Xem Phim Hay
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#bfdbfe",
          }}
        >
          vivutruyenhay.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
