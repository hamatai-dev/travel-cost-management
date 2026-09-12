"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT_PX = 640;

/**
 * 画面幅がTailwindのsmブレークポイント(640px)未満かどうかを判定する。
 * スマホでは物理キーボードではなく画面上のUI(電卓風テンキーなど)での
 * 操作を前提にしたい箇所で使う。
 */
export function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobile;
}
