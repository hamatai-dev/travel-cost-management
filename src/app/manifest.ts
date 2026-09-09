import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "支出管理アプリ",
    short_name: "支出管理",
    description: "旅行中の支出を一元管理・分析するアプリ",
    start_url: "/",
    display: "standalone",
    // デフォルトがダークモードなので、PWA起動時のスプラッシュ画面も
    // ダーク背景にして白フラッシュを防ぐ
    background_color: "#171717",
    theme_color: "#171717",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
