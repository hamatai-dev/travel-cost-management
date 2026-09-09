import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppChrome } from "@/components/app-shell/app-chrome";
import { RegisterServiceWorker } from "@/components/app-shell/register-service-worker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "支出管理アプリ",
  description: "旅行中の支出を一元管理・分析するアプリ",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "支出管理",
  },
};

export const viewport: Viewport = {
  themeColor: "#171717",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RegisterServiceWorker />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
