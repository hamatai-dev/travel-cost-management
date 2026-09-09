import { describe, expect, it } from "vitest";
import type { NormalizedTransaction } from "@/types/transaction";
import { buildImportRows } from "./buildImportRows";
import { computeDedupeHash } from "./dedupeHash";

describe("buildImportRows", () => {
  it("Given CSVアダプターが返した正規化済み取引, When buildImportRows を呼ぶ, Then account+date+amount+merchantから計算したdedupeHashを持つ行に変換する", () => {
    // Given
    const transactions: NormalizedTransaction[] = [
      {
        date: "2026-06-02",
        merchant: "ＡＭＡＺＯＮ　ＷＥＢ",
        amountOriginal: 14665,
        currencyOriginal: "JPY",
        amountJpy: 14665,
      },
    ];

    // When
    const rows = buildImportRows(transactions, "account-smbc");

    // Then
    expect(rows).toEqual([
      {
        accountId: "account-smbc",
        date: "2026-06-02",
        merchant: "ＡＭＡＺＯＮ　ＷＥＢ",
        memo: undefined,
        amountOriginal: 14665,
        currencyOriginal: "JPY",
        amountJpy: 14665,
        fxRate: undefined,
        country: undefined,
        city: undefined,
        categoryName: undefined,
        source: "csv_import",
        dedupeHash: computeDedupeHash(
          "account-smbc",
          "2026-06-02",
          14665,
          "ＡＭＡＺＯＮ　ＷＥＢ",
        ),
      },
    ]);
  });

  it("Given 同じ取引を含むCSVを2回インポートする, When それぞれ buildImportRows を呼ぶ, Then 同じdedupeHashになる(DB側のユニーク制約で再取込が弾かれる)", () => {
    // Given
    const transactions: NormalizedTransaction[] = [
      {
        date: "2026-06-02",
        merchant: "ＡＭＡＺＯＮ　ＷＥＢ",
        amountOriginal: 14665,
        currencyOriginal: "JPY",
      },
    ];

    // When: 1回目のインポートと、同じファイルを誤って再インポートした2回目
    const firstImport = buildImportRows(transactions, "account-smbc");
    const secondImport = buildImportRows(transactions, "account-smbc");

    // Then
    expect(firstImport[0].dedupeHash).toBe(secondImport[0].dedupeHash);
  });

  it("Given WiseのCSVのようにcategoryヒントを持つ取引, When buildImportRows を呼ぶ, Then categoryNameとして引き継ぐ", () => {
    // Given
    const transactions: NormalizedTransaction[] = [
      {
        date: "2026-09-08",
        merchant: "Sazonmixe - Mercado Pago",
        amountOriginal: 88,
        currencyOriginal: "MXN",
        category: "食料品",
      },
    ];

    // When
    const rows = buildImportRows(transactions, "account-wise");

    // Then
    expect(rows[0].categoryName).toBe("食料品");
  });

  it("Given 異なる口座に同じ内容の取引をインポートする, When buildImportRows を呼ぶ, Then 口座ごとに異なるdedupeHashになる(口座を跨いだ誤重複判定をしない)", () => {
    // Given
    const transactions: NormalizedTransaction[] = [
      {
        date: "2026-06-02",
        merchant: "ＡＭＡＺＯＮ　ＷＥＢ",
        amountOriginal: 14665,
        currencyOriginal: "JPY",
      },
    ];

    // When
    const rowsForAccountA = buildImportRows(transactions, "account-a");
    const rowsForAccountB = buildImportRows(transactions, "account-b");

    // Then
    expect(rowsForAccountA[0].dedupeHash).not.toBe(
      rowsForAccountB[0].dedupeHash,
    );
  });
});
