import { describe, expect, it } from "vitest";
import type { NormalizedTransaction } from "@/types/transaction";
import { applyCategoryInference } from "./applyCategoryInference";

describe("applyCategoryInference", () => {
  it("Given 既にcategoryが設定されている取引(Wiseの既存カテゴリなど), When applyCategoryInference を呼ぶ, Then 上書きせずそのまま残す", () => {
    // Given
    const transactions: NormalizedTransaction[] = [
      {
        date: "2026-09-08",
        merchant: "Soriana",
        amountOriginal: 184.01,
        currencyOriginal: "MXN",
        category: "食料品",
      },
    ];

    // When
    const result = applyCategoryInference(transactions);

    // Then
    expect(result[0].category).toBe("食料品");
  });

  it("Given categoryが未設定でルールにマッチする店名の取引, When applyCategoryInference を呼ぶ, Then 推定したカテゴリを補う", () => {
    // Given
    const transactions: NormalizedTransaction[] = [
      {
        date: "2026-06-11",
        merchant: "AIRBNB * HMX3TXKCBE利用国GB",
        amountOriginal: 9826,
        currencyOriginal: "JPY",
      },
    ];

    // When
    const result = applyCategoryInference(transactions);

    // Then
    expect(result[0].category).toBe("宿泊");
  });

  it("Given categoryが未設定でどのルールにもマッチしない取引, When applyCategoryInference を呼ぶ, Then categoryは未設定のまま(未分類として扱われる)", () => {
    // Given
    const transactions: NormalizedTransaction[] = [
      {
        date: "2026-06-05",
        merchant: "マネーフォワードクラウド",
        amountOriginal: 16896,
        currencyOriginal: "JPY",
      },
    ];

    // When
    const result = applyCategoryInference(transactions);

    // Then
    expect(result[0].category).toBeUndefined();
  });
});
