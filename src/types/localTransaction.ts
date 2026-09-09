import type { TransactionType } from "@/types/transaction";

// 端末ローカル(IndexedDB)に保持する、まだサーバーに同期していない現金入力。
// オフラインでもこの単位で保存でき、オンライン復帰時にそのまま同期対象になる。
export interface LocalTransactionInput {
  amount: number;
  currency?: string; // 未指定なら "JPY"
  merchant?: string;
  memo?: string;
  categoryName?: string;
  date?: string; // ISO 8601 (YYYY-MM-DD)。未指定なら入力時点の日付
  country?: string;
  city?: string;
  transactionType?: TransactionType; // 未指定なら "expense"(支出)
}

export interface LocalTransaction {
  clientUuid: string;
  date: string;
  merchant: string;
  memo?: string;
  amountOriginal: number;
  currencyOriginal: string;
  categoryName?: string;
  country?: string;
  city?: string;
  source: "cash";
  transactionType: TransactionType;
  // 手入力はCSVと違って店名だけでは重複判定できない(同じ店で同額を2回払うことは
  // 普通にある)ため、端末生成のclientUuidそのものを重複キーとして使う。
  dedupeHash: string;
  createdAt: string;
  syncedAt?: string;
}
