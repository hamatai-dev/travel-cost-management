import { describe, expect, it } from "vitest";
import { buildTransactionsPrintHtml } from "./buildTransactionsPrintHtml";
import type { ExportableTransaction } from "./buildTransactionsCsv";

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

describe("buildTransactionsPrintHtml", () => {
  it("Given 取引が1件もない, When buildTransactionsPrintHtml を呼ぶ, Then タイトル・期間ラベル・0件の合計(¥0)を含むHTMLを返す", () => {
    // Given / When
    const html = buildTransactionsPrintHtml([], "2026年6月");

    // Then
    expect(html).toContain("<title>取引一覧(2026年6月)</title>");
    expect(html).toContain("0件");
    expect(html).toContain("&yen;0");
  });

  it("Given 支出500円と収入1000円の取引, When buildTransactionsPrintHtml を呼ぶ, Then それぞれの合計行が正しく計算される", () => {
    // Given
    const rows = [
      makeRow({ amountJpy: 500, transactionType: "expense" }),
      makeRow({ amountJpy: 1000, transactionType: "income", merchant: "クライアントA" }),
    ];

    // When
    const html = buildTransactionsPrintHtml(rows, "2026年6月");

    // Then
    expect(html).toContain("&yen;500");
    expect(html).toContain("&yen;1,000");
  });

  it("Given 支払い先にHTML特殊文字が含まれる, When buildTransactionsPrintHtml を呼ぶ, Then エスケープされ壊れない", () => {
    // Given
    const rows = [makeRow({ merchant: "<script>alert(1)</script>" })];

    // When
    const html = buildTransactionsPrintHtml(rows, "2026年6月");

    // Then
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
