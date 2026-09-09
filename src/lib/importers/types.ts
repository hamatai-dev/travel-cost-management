import type { NormalizedTransaction } from "@/types/transaction";

export interface CsvAdapter {
  id: "smbc" | "epos" | "rakuten" | "wise";
  label: string;
  /** ファイル内容の先頭部分から、このアダプターが対応する形式かどうかを判定する */
  detect: (text: string) => boolean;
  /** デコード済みのCSV全文を正規化済みトランザクション配列に変換する */
  parse: (text: string) => NormalizedTransaction[];
}
