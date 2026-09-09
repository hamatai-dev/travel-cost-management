import type { NormalizedTransaction } from "@/types/transaction";
import { computeDedupeHash } from "./dedupeHash";

export interface ImportRow {
  accountId: string;
  date: string;
  merchant: string;
  memo?: string;
  amountOriginal: number;
  currencyOriginal: string;
  amountJpy?: number;
  fxRate?: number;
  country?: string;
  city?: string;
  categoryName?: string;
  source: "csv_import";
  dedupeHash: string;
}

/**
 * CSVアダプターが出力した正規化済みトランザクションを、DB挿入用の行に変換する。
 * dedupeHash を account+date+amount+merchant から計算するため、同じCSVを
 * 再インポートしても同じハッシュになり、DB側のユニーク制約で自動的に弾かれる。
 */
export function buildImportRows(
  transactions: NormalizedTransaction[],
  accountId: string,
): ImportRow[] {
  return transactions.map((t) => ({
    accountId,
    date: t.date,
    merchant: t.merchant,
    memo: t.memo,
    amountOriginal: t.amountOriginal,
    currencyOriginal: t.currencyOriginal,
    amountJpy: t.amountJpy,
    fxRate: t.fxRate,
    country: t.country,
    city: t.city,
    categoryName: t.category,
    source: "csv_import",
    dedupeHash: computeDedupeHash(accountId, t.date, t.amountOriginal, t.merchant),
  }));
}
