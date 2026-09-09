import type { TransactionType } from "@/types/transaction";

export interface ExportableTransaction {
  date: string;
  merchant: string | null;
  amountOriginal: number;
  currencyOriginal: string;
  amountJpy: number | null;
  categoryName: string;
  accountName: string;
  country: string | null;
  memo: string | null;
  source: string;
  transactionType: TransactionType;
}

const TYPE_LABEL: Record<TransactionType, string> = {
  expense: "支出",
  income: "収入",
};

const HEADER = [
  "日付",
  "種別",
  "支払い先",
  "金額",
  "通貨",
  "円換算",
  "カテゴリ",
  "支払い種別",
  "国",
  "メモ",
  "取込元",
];

function escapeCsvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * 取引データをCSVテキストに変換する(バックアップ・書き出し用)。
 * 店名やメモにカンマ・改行・ダブルクォートが含まれても壊れないよう、
 * 全フィールドをダブルクォートで囲む。
 */
export function buildTransactionsCsv(rows: ExportableTransaction[]): string {
  const lines = [HEADER.map(escapeCsvField).join(",")];

  for (const row of rows) {
    lines.push(
      [
        row.date,
        TYPE_LABEL[row.transactionType],
        row.merchant ?? "",
        String(row.amountOriginal),
        row.currencyOriginal,
        row.amountJpy != null ? String(row.amountJpy) : "",
        row.categoryName,
        row.accountName,
        row.country ?? "",
        row.memo ?? "",
        row.source,
      ]
        .map(escapeCsvField)
        .join(","),
    );
  }

  return lines.join("\r\n");
}
