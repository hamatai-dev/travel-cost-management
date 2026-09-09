"use client";

import { Tag, Wallet, History, Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { exportTransactionsCsv } from "@/lib/transactions/supabaseExportTransactions";

const ITEMS = [
  { href: "/settings/categories", label: "カテゴリ管理", icon: Tag },
  { href: "/settings/accounts", label: "支払い種別管理", icon: Wallet },
  { href: "/settings/imports", label: "インポート履歴", icon: History },
];

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) throw new Error("ログイン情報が確認できませんでした。");

      const csv = await exportTransactionsCsv(supabase, userId);
      // 先頭にBOMを付けてExcelでも文字化けせずに開けるようにする
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("エクスポートしました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エクスポートに失敗しました");
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-3 p-4">
      <h1 className="text-xl font-semibold">設定</h1>

      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <span>テーマ</span>
          <ThemeToggle />
        </CardContent>
      </Card>

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

      <button type="button" onClick={handleExport} disabled={exporting} className="text-left">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Download className="size-5 text-muted-foreground" />
            <span>{exporting ? "エクスポート中..." : "全データをCSVでエクスポート"}</span>
          </CardContent>
        </Card>
      </button>
    </main>
  );
}
