"use client";

import { User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/app/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";

// 常時表示されるヘッダー。アプリアイコン・テーマ切り替え・ログイン中ユーザーの
// 表示名(未設定ならメールアドレス、クリックでマイページへ)・サインアウトを置く。
export function Header() {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const user = data.user;
      if (!user) return;
      const name =
        typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name
          ? user.user_metadata.full_name
          : (user.email ?? "");
      setDisplayName(name);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
        >
          ¥
        </span>
        <span className="text-sm font-semibold">支出管理アプリ</span>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/mypage"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <User className="size-4" />
          {displayName && <span className="max-w-32 truncate">{displayName}</span>}
        </Link>
        <SignOutButton />
      </div>
    </header>
  );
}
