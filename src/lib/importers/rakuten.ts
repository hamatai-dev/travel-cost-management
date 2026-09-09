import Papa from "papaparse";
import type { NormalizedTransaction } from "@/types/transaction";
import type { CsvAdapter } from "./types";

// 楽天カード(楽天e-NAVI)の明細CSV(UTF-8、ダブルクォート囲み)フォーマット:
// [利用日, 利用店名・商品名, 利用者, 支払方法, 利用金額, ...]
// 海外利用の行の直後に「利用日が空欄」の内訳行(現地利用額・変換レート)が続くが、
// 通貨コードは含まれておらず取引としても実体を持たないため、そのままスキップする。
const DATE_RE = /^\d{4}\/\d{1,2}\/\d{1,2}$/;

function toIsoDate(jpDate: string): string {
  const [y, m, d] = jpDate.split("/").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export const rakutenAdapter: CsvAdapter = {
  id: "rakuten",
  label: "楽天カード",
  detect: (text) => text.includes("利用店名・商品名"),
  parse: (text) => {
    const rows = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true })
      .data;
    const transactions: NormalizedTransaction[] = [];

    for (const row of rows) {
      const date = row[0]?.trim();
      if (!date || !DATE_RE.test(date)) continue; // ヘッダー行・内訳行・合計行を除外

      const merchant = row[1]?.trim();
      const amountJpy = Number(row[4]?.trim().replace(/,/g, ""));
      if (!merchant || Number.isNaN(amountJpy)) continue;

      transactions.push({
        date: toIsoDate(date),
        merchant,
        amountOriginal: amountJpy,
        currencyOriginal: "JPY",
        amountJpy,
      });
    }

    return transactions;
  },
};
