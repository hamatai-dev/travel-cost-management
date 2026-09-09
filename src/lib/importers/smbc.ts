import Papa from "papaparse";
import type { NormalizedTransaction } from "@/types/transaction";
import type { CsvAdapter } from "./types";

// 三井住友カードの明細CSV(Shift-JIS、ヘッダーなし)フォーマット:
// [利用日, 利用店名, 利用金額, "1", "1", 利用金額(重複), 海外利用情報 or 備考]
// 1行目は名義・カード番号の行、最終行は合計行(日付が空)なのでどちらも除外する。
const DATE_RE = /^\d{4}\/\d{1,2}\/\d{1,2}$/;
const FX_RE = /^([\d.]+)\s+([A-Za-z]{3})\s+([\d.]+)\s+\d{2}\s+\d{2}$/;

function toIsoDate(jpDate: string): string {
  const [y, m, d] = jpDate.split("/").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export const smbcAdapter: CsvAdapter = {
  id: "smbc",
  label: "三井住友カード",
  detect: (text) => text.includes("三井住友カード"),
  parse: (text) => {
    const rows = Papa.parse<string[]>(text.trim(), { skipEmptyLines: false })
      .data;
    const transactions: NormalizedTransaction[] = [];

    for (const row of rows) {
      const date = row[0]?.trim();
      const merchant = row[1]?.trim();
      const amountStr = row[2]?.trim();
      if (!date || !DATE_RE.test(date)) continue; // 名義行・合計行を除外
      if (!merchant || !amountStr) continue;

      const amountJpy = Number(amountStr.replace(/,/g, ""));
      if (Number.isNaN(amountJpy)) continue;

      const trailing = row[6]?.trim();
      const fxMatch = trailing ? trailing.match(FX_RE) : null;

      transactions.push({
        date: toIsoDate(date),
        merchant,
        memo: !fxMatch && trailing ? trailing : undefined,
        amountOriginal: fxMatch ? Number(fxMatch[1]) : amountJpy,
        currencyOriginal: fxMatch ? fxMatch[2] : "JPY",
        amountJpy,
        fxRate: fxMatch ? Number(fxMatch[3]) : undefined,
      });
    }

    return transactions;
  },
};
