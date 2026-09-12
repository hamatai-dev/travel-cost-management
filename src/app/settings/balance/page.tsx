"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  fetchInitialBalance,
  saveInitialBalance,
} from "@/lib/settings/supabaseUserSettings";

export default function InitialBalanceSettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [amount, setAmount] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id;
      if (!uid || cancelled) return;
      setUserId(uid);
      try {
        const initialBalance = await fetchInitialBalance(supabase, uid);
        if (!cancelled) setAmount(String(initialBalance));
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "取得に失敗しました");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (!userId) return;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed)) {
      toast.error("正しい金額を入力してください");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      await saveInitialBalance(supabase, userId, parsed);
      toast.success("保存しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4 [&>*]:min-w-0">
      <div>
        <h1 className="text-xl font-semibold">初期残高設定</h1>
        <p className="text-sm text-muted-foreground">
          記録を始める前から手元にあった残高を入力してください。集計ページの
          「現在の総残高」は、ここで設定した金額に全期間の収支(収入-支出)を
          加算して計算されます。
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <div>
          <Label htmlFor="initial-balance" className="mb-1.5">
            初期残高(円)
          </Label>
          <Input
            id="initial-balance"
            type="number"
            inputMode="decimal"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      )}

      <Button onClick={handleSave} disabled={loading || saving}>
        {saving ? "保存中..." : "保存する"}
      </Button>
    </main>
  );
}
