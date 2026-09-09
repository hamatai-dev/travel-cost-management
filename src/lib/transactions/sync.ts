import type { LocalTransaction } from "@/types/localTransaction";

export type InsertOutcome = "inserted" | "already_synced" | "failed";

export interface SyncDeps {
  listPending: () => Promise<LocalTransaction[]>;
  /** 1件をサーバーへ送信する。冪等性の判断(重複キー衝突=already_synced)はこの関数の責務。 */
  insert: (tx: LocalTransaction) => Promise<InsertOutcome>;
  markSynced: (clientUuid: string, syncedAt: string) => Promise<void>;
  now?: () => Date;
}

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
}

/**
 * ローカルに溜まった未同期の現金入力をサーバーへ送る。
 * 1件の失敗で全体を止めず、成功/冪等ヒット分だけを同期済みにマークする。
 * オンライン復帰時・アプリ起動時・定期実行のいずれからも呼ばれる想定。
 */
export async function syncPendingTransactions(
  deps: SyncDeps,
): Promise<SyncResult> {
  const pending = await deps.listPending();
  const now = deps.now ?? (() => new Date());

  let syncedCount = 0;
  let failedCount = 0;

  for (const tx of pending) {
    const outcome = await deps.insert(tx);

    if (outcome === "inserted" || outcome === "already_synced") {
      await deps.markSynced(tx.clientUuid, now().toISOString());
      syncedCount += 1;
    } else {
      failedCount += 1;
    }
  }

  return { syncedCount, failedCount };
}
