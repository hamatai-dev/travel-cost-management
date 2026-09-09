"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "./bottom-nav";
import { Header } from "./header";

const NO_CHROME_PATHS = ["/login", "/reset-password"];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !NO_CHROME_PATHS.some((p) => pathname.startsWith(p));

  return (
    <>
      {showNav && <Header />}
      <div className={showNav ? "pb-16" : undefined}>{children}</div>
      {showNav && <BottomNav />}
      <Toaster />
    </>
  );
}
