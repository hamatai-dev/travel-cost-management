import { beforeEach, describe, expect, it } from "vitest";
import { buildCashTransaction } from "@/lib/transactions/cashEntry";
import {
  enqueueCashTransaction,
  LocalDatabase,
  listAllLocalTransactions,
  listPendingTransactions,
  markTransactionSynced,
} from "./localDb";

describe("ローカルDB(IndexedDB)への現金入力の保存と同期状態管理", () => {
  let db: LocalDatabase;

  beforeEach(() => {
    // テストごとに独立したDBを使い、状態が漏れないようにする
    db = new LocalDatabase(`test-db-${crypto.randomUUID()}`);
  });

  it("Given オフラインで現金入力を保存する, When listPendingTransactions を呼ぶ, Then 保存した取引が未同期一覧に含まれる", async () => {
    // Given
    const tx = buildCashTransaction({ amount: 500, merchant: "屋台のタコス" });
    await enqueueCashTransaction(db, tx);

    // When
    const pending = await listPendingTransactions(db);

    // Then
    expect(pending).toHaveLength(1);
    expect(pending[0].clientUuid).toBe(tx.clientUuid);
  });

  it("Given 保存済みの取引を同期済みにマークする, When listPendingTransactions を呼ぶ, Then 未同期一覧には含まれなくなる", async () => {
    // Given
    const tx = buildCashTransaction({ amount: 500, merchant: "屋台のタコス" });
    await enqueueCashTransaction(db, tx);

    // When
    await markTransactionSynced(db, tx.clientUuid, "2026-09-08T10:00:00.000Z");
    const pending = await listPendingTransactions(db);

    // Then
    expect(pending).toHaveLength(0);
  });

  it("Given 未同期と同期済みの取引が混在する, When listAllLocalTransactions を呼ぶ, Then 同期状態に関わらず全件返す", async () => {
    // Given
    const synced = buildCashTransaction({ amount: 100, merchant: "同期済み" });
    const pending = buildCashTransaction({ amount: 200, merchant: "未同期" });
    await enqueueCashTransaction(db, synced);
    await enqueueCashTransaction(db, pending);
    await markTransactionSynced(db, synced.clientUuid, "2026-09-08T10:00:00.000Z");

    // When
    const all = await listAllLocalTransactions(db);

    // Then
    expect(all.map((t) => t.clientUuid).sort()).toEqual(
      [synced.clientUuid, pending.clientUuid].sort(),
    );
  });

  it("Given 同じclientUuidで再度enqueueする, When listAllLocalTransactions を呼ぶ, Then 上書きされ重複しない", async () => {
    // Given
    const tx = buildCashTransaction({ amount: 500, merchant: "屋台のタコス" });
    await enqueueCashTransaction(db, tx);

    // When: 同じclientUuidのまま内容だけ変えて再保存(オフライン編集の再送などを想定)
    await enqueueCashTransaction(db, { ...tx, amountOriginal: 600 });
    const all = await listAllLocalTransactions(db);

    // Then
    expect(all).toHaveLength(1);
    expect(all[0].amountOriginal).toBe(600);
  });
});
