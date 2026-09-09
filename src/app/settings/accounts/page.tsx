"use client";

import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchAccounts,
  renameAccount,
} from "@/lib/accounts/supabaseAccountManagement";
import { createClient } from "@/lib/supabase/client";
import { createNameSchema } from "@/lib/validation/nameSchema";
import type { Account, AccountType } from "@/types/transaction";

const accountNameSchema = createNameSchema("支払い種別名");

const TYPE_LABEL: Record<AccountType, string> = {
  credit_card: "クレジットカード",
  debit_card: "デビットカード",
  cash: "現金",
};

export default function AccountSettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function load(uid: string) {
    const supabase = createClient();
    const list = await fetchAccounts(supabase, uid);
    setAccounts(list);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid || cancelled) return;
      setUserId(uid);
      load(uid);
    });
    return () => {
      cancelled = true;
    };
     
  }, []);

  async function handleRename(id: string) {
    const parsed = accountNameSchema.safeParse(editingName);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message);
      return;
    }

    try {
      const supabase = createClient();
      await renameAccount(supabase, id, parsed.data);
      setEditingId(null);
      toast.success("更新しました");
      if (userId) load(userId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">支払い種別管理</h1>
        <p className="text-sm text-muted-foreground">
          CSVインポートや現金入力で自動的に作成された支払い種別の名前を変更できます。
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          まだ支払い種別がありません。CSVインポートや現金入力をすると自動的に作成されます。
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {accounts.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 p-3">
              {editingId === a.id ? (
                <div className="flex flex-1 gap-2">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename(a.id)}
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleRename(a.id)}>
                    保存
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    キャンセル
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex items-center gap-2">
                    {a.name}
                    <Badge variant="secondary">{TYPE_LABEL[a.type]}</Badge>
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(a.id);
                      setEditingName(a.name);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
