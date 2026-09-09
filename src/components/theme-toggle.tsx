"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// next-themesはSSR時にはテーマを確定できない(クライアントのlocalStorage次第)ため、
// マウント前に現在値を参照するとハイドレーション不一致になる。マウント後だけ
// 実際のトグルを描画し、それまではレイアウト崩れを避けるための骨組みだけ出す。
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-8 w-[104px] rounded-lg bg-muted" />;
  }

  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      <button
        type="button"
        aria-pressed={theme === "light"}
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors",
          theme === "light"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground",
        )}
      >
        <Sun className="size-4" />
        ライト
      </button>
      <button
        type="button"
        aria-pressed={theme === "dark"}
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors",
          theme === "dark" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
        )}
      >
        <Moon className="size-4" />
        ダーク
      </button>
    </div>
  );
}
