import Dexie, { type Table } from "dexie";
import type { LocalTransaction } from "@/types/localTransaction";

export class LocalDatabase extends Dexie {
  transactions!: Table<LocalTransaction, string>;

  constructor(name = "travel-cost-management") {
    super(name);
    this.version(1).stores({
      // clientUuid を主キーにして同一エントリの再保存を上書きにする。
      // syncedAt にインデックスを張り、未同期分の抽出を高速にする。
      transactions: "clientUuid, syncedAt",
    });
  }
}

export const localDb = new LocalDatabase();

export async function enqueueCashTransaction(
  db: LocalDatabase,
  tx: LocalTransaction,
): Promise<void> {
  await db.transactions.put(tx);
}

export async function listPendingTransactions(
  db: LocalDatabase,
): Promise<LocalTransaction[]> {
  return db.transactions.filter((t) => !t.syncedAt).toArray();
}

export async function listAllLocalTransactions(
  db: LocalDatabase,
): Promise<LocalTransaction[]> {
  return db.transactions.orderBy("clientUuid").reverse().toArray();
}

export async function markTransactionSynced(
  db: LocalDatabase,
  clientUuid: string,
  syncedAt: string,
): Promise<void> {
  await db.transactions.update(clientUuid, { syncedAt });
}
