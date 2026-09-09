"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { fetchAccountNameMap } from "@/lib/transactions/supabaseTransactions";
import {
  deleteImportBatch,
  fetchImportBatches,
  type ImportBatchRow,
} from "@/lib/transactions/supabaseImportBatches";

export default function ImportHistoryPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [batches, setBatches] = useState<ImportBatchRow[]>([]);
  const [accountNames, setAccountNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  async function load(uid: string) {
    const supabase = createClient();
    const [batchList, accountMap] = await Promise.all([
      fetchImportBatches(supabase, uid),
      fetchAccountNameMap(supabase, uid),
    ]);
    setBatches(batchList);
    setAccountNames(accountMap);
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

  async function handleUndo(batch: ImportBatchRow) {
    if (
      !confirm(
        `このインポート(${batch.file_name ?? "ファイル名不明"}、${batch.row_count}件)を取り消します。取り込まれた取引もすべて削除されます。よろしいですか?`,
      )
    ) {
      return;
    }

    try {
      const supabase = createClient();
      await deleteImportBatch(supabase, batch.id);
      toast.success("取り消しました");
      if (userId) load(userId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "取り消しに失敗しました");
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">インポート履歴</h1>
        <p className="text-sm text-muted-foreground">
          誤って取り込んだ場合は取り消せます(そのインポートで追加された取引がすべて削除されます)。
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : batches.length === 0 ? (
        <p className="text-sm text-muted-foreground">インポート履歴はまだありません。</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {batches.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-2 p-3 text-sm">
              <div>
                <p className="font-medium">{b.file_name ?? "ファイル名不明"}</p>
                <p className="text-muted-foreground">
                  {accountNames.get(b.account_id) ?? "-"} ・ {b.row_count}件 ・{" "}
                  {new Date(b.imported_at).toLocaleString("ja-JP")}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => handleUndo(b)}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
