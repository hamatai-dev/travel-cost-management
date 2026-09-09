"use client";

import { useEffect } from "react";

const CACHE_NAME = "app-shell-v1";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // 開発時(next dev)はJSチャンクのファイル名がビルドのたびに変わらないため、
      // sw.jsの「/_next/static/はキャッシュ優先」戦略とかみ合わず、ビルドし直して
      // ハード再読み込みしても古いJSが返り続けてしまう。開発中は登録しないだけでなく、
      // 過去にこのアプリを開いたことがあり既に登録済みのSW・キャッシュも
      // ここで掃除しておく(次回以降のリロードから解消される)。
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      if ("caches" in window) {
        caches.delete(CACHE_NAME);
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // オフライン対応が使えないだけなので、アプリ自体は通常通り動かす
    });
  }, []);

  return null;
}
