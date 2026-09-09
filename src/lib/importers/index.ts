import type { NormalizedTransaction } from "@/types/transaction";
import { decodeCsvBuffer } from "./encoding";
import { eposAdapter } from "./epos";
import { rakutenAdapter } from "./rakuten";
import { smbcAdapter } from "./smbc";
import type { CsvAdapter } from "./types";
import { wiseAdapter } from "./wise";

export const adapters: CsvAdapter[] = [
  smbcAdapter,
  eposAdapter,
  rakutenAdapter,
  wiseAdapter,
];

export interface ParseCsvResult {
  adapter: CsvAdapter;
  transactions: NormalizedTransaction[];
}

export class UnrecognizedCsvFormatError extends Error {
  constructor() {
    super(
      "対応しているカード会社/Wiseの形式と一致しませんでした。フォーマットが変更された可能性があります。",
    );
  }
}

export async function parseCsvFile(file: File): Promise<ParseCsvResult> {
  const buffer = await file.arrayBuffer();
  const text = decodeCsvBuffer(buffer);

  const adapter = adapters.find((a) => a.detect(text));
  if (!adapter) throw new UnrecognizedCsvFormatError();

  return { adapter, transactions: adapter.parse(text) };
}
