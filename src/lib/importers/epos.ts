import Papa from "papaparse";
import type { NormalizedTransaction } from "@/types/transaction";
import type { CsvAdapter } from "./types";

// エポスカードの明細CSV(Shift-JIS、1行目サマリー+2行目ヘッダー)フォーマット:
// [種別, ご利用年月日("2026年1月6日"), ご利用場所, ご利用内容, ご利用金額, 支払区分, お支払開始月, 備考]
// 海外利用時は備考に "USD11　(1USD=163.454545円 換算日...)" の形式で付記される。
const DATE_RE = /(\d{4})年(\d{1,2})月(\d{1,2})日/;
const FX_RE = /^([A-Z]{3})([\d.]+)\s*\(1[A-Z]{3}=([\d.]+)円/;
const VALID_TYPES = new Set(["ショッピング", "キャッシング", "その他"]);

export const eposAdapter: CsvAdapter = {
  id: "epos",
  label: "エポスカード",
  detect: (text) => text.includes("エポスカード"),
  parse: (text) => {
    const rows = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true })
      .data;
    const transactions: NormalizedTransaction[] = [];

    for (const row of rows) {
      const type = row[0]?.trim();
      if (!type || !VALID_TYPES.has(type)) continue; // サマリー行・ヘッダー行を除外

      const dateMatch = row[1]?.match(DATE_RE);
      const merchant = row[2]?.trim();
      const amountStr = row[4]?.trim();
      if (!dateMatch || !merchant || !amountStr) continue;

      const amountJpy = Number(amountStr.replace(/,/g, ""));
      if (Number.isNaN(amountJpy)) continue;

      const [, y, m, d] = dateMatch;
      const remark = row[7]?.trim();
      const fxMatch = remark ? remark.match(FX_RE) : null;

      transactions.push({
        date: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`,
        merchant,
        memo: !fxMatch && remark ? remark : undefined,
        amountOriginal: fxMatch ? Number(fxMatch[2]) : amountJpy,
        currencyOriginal: fxMatch ? fxMatch[1] : "JPY",
        amountJpy,
        fxRate: fxMatch ? Number(fxMatch[3]) : undefined,
      });
    }

    return transactions;
  },
};
