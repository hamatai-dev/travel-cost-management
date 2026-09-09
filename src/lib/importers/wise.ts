import Papa from "papaparse";
import type { NormalizedTransaction } from "@/types/transaction";
import type { CsvAdapter } from "./types";

// Wiseの取引履歴CSV(UTF-8、ヘッダーあり)フォーマット。列名が重複するため位置で読む:
// 0:ID 1:ステータス 2:送金の種類(IN/OUT) 3:作成日 4:完了日 ... 10:送金額 11:通貨
// 12:送金先(店名) 13:受取額 14:受取通貨 15:為替レート ... 19:カテゴリ 20:備考
//
// IDが CARD_TRANSACTION- で始まりステータスが COMPLETED / 種別が OUT の行だけを
// 実際のデビットカード支出として取り込む(チャージ・送金・返金・保留中は除外)。
// カテゴリ列に既存の日本語カテゴリが入っていればヒントとしてそのまま引き継ぐ。
export const wiseAdapter: CsvAdapter = {
  id: "wise",
  label: "Wise",
  detect: (text) => text.includes("送金の種類") && text.includes("受取通貨"),
  parse: (text) => {
    const rows = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true })
      .data;
    const [, ...dataRows] = rows;
    const transactions: NormalizedTransaction[] = [];

    for (const row of dataRows) {
      const id = row[0];
      const status = row[1];
      const direction = row[2];
      if (
        !id?.startsWith("CARD_TRANSACTION") ||
        status !== "COMPLETED" ||
        direction !== "OUT"
      ) {
        continue;
      }

      const date = row[3]?.split(" ")[0];
      const amountOriginal = Number(row[10]);
      const currencyOriginal = row[11]?.trim();
      const merchant = row[12]?.trim();
      const category = row[19]?.trim() || undefined;
      const memo = row[20]?.trim() || undefined;

      if (!date || !currencyOriginal || Number.isNaN(amountOriginal)) continue;

      transactions.push({
        date,
        merchant: merchant || "不明",
        memo,
        amountOriginal,
        currencyOriginal,
        category,
      });
    }

    return transactions;
  },
};
