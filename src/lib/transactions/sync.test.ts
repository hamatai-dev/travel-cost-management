import { describe, expect, it, vi } from "vitest";
import type { LocalTransaction } from "@/types/localTransaction";
import { syncPendingTransactions } from "./sync";

function makeLocalTx(overrides: Partial<LocalTransaction> = {}): LocalTransaction {
  return {
    clientUuid: crypto.randomUUID(),
    date: "2026-09-08",
    merchant: "屋台のタコス",
    amountOriginal: 500,
    currencyOriginal: "JPY",
    source: "cash",
    transactionType: "expense",
    dedupeHash: crypto.randomUUID(),
    createdAt: "2026-09-08T10:00:00.000Z",
    ...overrides,
  };
}

describe("syncPendingTransactions", () => {
  it("Given 未同期の取引が複数あり全件insertが成功する, When 同期を実行する, Then 全件をmarkSyncedし syncedCount が件数と一致する", async () => {
    // Given
    const pending = [makeLocalTx(), makeLocalTx(), makeLocalTx()];
    const insert = vi.fn().mockResolvedValue("inserted");
    const markSynced = vi.fn().mockResolvedValue(undefined);

    // When
    const result = await syncPendingTransactions({
      listPending: async () => pending,
      insert,
      markSynced,
      now: () => new Date("2026-09-08T12:00:00.000Z"),
    });

    // Then
    expect(result).toEqual({ syncedCount: 3, failedCount: 0 });
    expect(insert).toHaveBeenCalledTimes(3);
    expect(markSynced).toHaveBeenCalledTimes(3);
    for (const tx of pending) {
      expect(markSynced).toHaveBeenCalledWith(
        tx.clientUuid,
        "2026-09-08T12:00:00.000Z",
      );
    }
  });

  it("Given 一部の取引でinsertが失敗する(ネットワークエラー等), When 同期を実行する, Then 失敗分はmarkSyncedされず、残りの同期は継続される", async () => {
    // Given
    const ok1 = makeLocalTx();
    const bad = makeLocalTx();
    const ok2 = makeLocalTx();
    const insert = vi.fn(async (tx: LocalTransaction) =>
      tx.clientUuid === bad.clientUuid ? "failed" : "inserted",
    );
    const markSynced = vi.fn().mockResolvedValue(undefined);

    // When
    const result = await syncPendingTransactions({
      listPending: async () => [ok1, bad, ok2],
      insert,
      markSynced,
    });

    // Then
    expect(result).toEqual({ syncedCount: 2, failedCount: 1 });
    expect(markSynced).not.toHaveBeenCalledWith(
      bad.clientUuid,
      expect.anything(),
    );
  });

  it("Given サーバーに同じ取引が既に存在する(再送によるユニーク制約衝突), When 同期を実行する, Then エラー扱いにせず同期済みとしてmarkする(冪等)", async () => {
    // Given: 前回の同期がネットワーク切断でmarkSynced前に途切れ、再送されたケースを想定
    const alreadySyncedOnServer = makeLocalTx();
    const insert = vi.fn().mockResolvedValue("already_synced");
    const markSynced = vi.fn().mockResolvedValue(undefined);

    // When
    const result = await syncPendingTransactions({
      listPending: async () => [alreadySyncedOnServer],
      insert,
      markSynced,
    });

    // Then
    expect(result).toEqual({ syncedCount: 1, failedCount: 0 });
    expect(markSynced).toHaveBeenCalledWith(
      alreadySyncedOnServer.clientUuid,
      expect.any(String),
    );
  });

  it("Given 未同期の取引が1件もない, When 同期を実行する, Then insert・markSyncedは呼ばれず両カウントとも0になる", async () => {
    // Given
    const insert = vi.fn();
    const markSynced = vi.fn();

    // When
    const result = await syncPendingTransactions({
      listPending: async () => [],
      insert,
      markSynced,
    });

    // Then
    expect(result).toEqual({ syncedCount: 0, failedCount: 0 });
    expect(insert).not.toHaveBeenCalled();
    expect(markSynced).not.toHaveBeenCalled();
  });
});
