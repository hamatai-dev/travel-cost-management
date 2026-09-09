import { describe, expect, it } from "vitest";
import {
  buildTransactionsCsv,
  type ExportableTransaction,
} from "./buildTransactionsCsv";

function makeRow(overrides: Partial<ExportableTransaction> = {}): ExportableTransaction {
  return {
    date: "2026-06-02",
    merchant: "屋台のタコス",
    amountOriginal: 500,
    currencyOriginal: "MXN",
    amountJpy: 4000,
    categoryName: "外食",
    accountName: "現金",
    country: "メキシコ",
    memo: null,
    source: "cash",
    transactionType: "expense",
    ...overrides,
  };
}

describe("buildTransactionsCsv", () => {
  it("Given 取引が1件もない, When buildTransactionsCsv を呼ぶ, Then ヘッダー行だけを返す", () => {
    // Given / When
    const csv = buildTransactionsCsv([]);

    // Then
    expect(csv).toBe(
      '"日付","種別","支払い先","金額","通貨","円換算","カテゴリ","支払い種別","国","メモ","取込元"',
    );
  });

  it("Given 複数件の取引データ, When buildTransactionsCsv を呼ぶ, Then ヘッダー行に続けて各行がCSV形式で出力される", () => {
    // Given
    const rows = [makeRow()];

    // When
    const csv = buildTransactionsCsv(rows);
    const lines = csv.split("\r\n");

    // Then
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(
      '"2026-06-02","支出","屋台のタコス","500","MXN","4000","外食","現金","メキシコ","","cash"',
    );
  });

  it("Given 収入の取引データ, When buildTransactionsCsv を呼ぶ, Then 種別欄が「収入」になる", () => {
    // Given
    const rows = [makeRow({ transactionType: "income", categoryName: "事業収入" })];

    // When
    const csv = buildTransactionsCsv(rows);
    const dataLine = csv.split("\r\n")[1];

    // Then
    expect(dataLine.split(",")[1]).toBe('"収入"');
  });

  it("Given 店名にカンマ・改行・ダブルクォートが含まれる, When buildTransactionsCsv を呼ぶ, Then 正しくエスケープされ壊れない", () => {
    // Given
    const rows = [makeRow({ merchant: '店名,"改行\n入り"' })];

    // When
    const csv = buildTransactionsCsv(rows);

    // Then: ダブルクォートは""にエスケープされ、フィールド全体がダブルクォートで囲まれる
    expect(csv).toContain('"店名,""改行\n入り"""');
  });

  it("Given 円換算が未確定(null)の行, When buildTransactionsCsv を呼ぶ, Then 円換算欄は空文字として出力する", () => {
    // Given
    const rows = [makeRow({ amountJpy: null })];

    // When
    const csv = buildTransactionsCsv(rows);
    const dataLine = csv.split("\r\n")[1];

    // Then
    const fields = dataLine.split(",");
    expect(fields[5]).toBe('""'); // 円換算欄
  });
});
