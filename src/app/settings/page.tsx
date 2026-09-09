"use client";

import { Tag, Wallet, History, User } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const ITEMS = [
  { href: "/mypage", label: "マイページ", icon: User },
  { href: "/settings/categories", label: "カテゴリ管理", icon: Tag },
  { href: "/settings/accounts", label: "支払い種別管理", icon: Wallet },
  { href: "/settings/imports", label: "インポート履歴", icon: History },
];

export default function SettingsPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-3 p-4">
      <h1 className="text-xl font-semibold">設定</h1>

      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href}>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Icon className="size-5 text-muted-foreground" />
              <span>{label}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </main>
  );
}
