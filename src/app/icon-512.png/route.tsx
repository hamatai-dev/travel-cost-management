import { ImageResponse } from "next/og";

// PWAのmanifest.jsonから参照する固定サイズアイコン(512x512)。
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#171717",
          color: "#ffffff",
          fontSize: 320,
          fontWeight: 700,
        }}
      >
        ¥
      </div>
    ),
    { width: 512, height: 512 },
  );
}
