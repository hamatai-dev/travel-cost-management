import { describe, expect, it } from "vitest";
import {
  totalByAccount,
  totalByCategory,
  totalByCountry,
  totalByMonth,
  type AggregatableTx,
} from "./aggregate";

describe("totalByCategory", () => {
  it("Given 複数カテゴリの取引がある, When totalByCategory を呼ぶ, Then カテゴリごとに合計しJPY金額の降順で並べる", () => {
    // Given
    const transactions: AggregatableTx[] = [
      { amountJpy: 1000, categoryName: "外食", date: "2026-06-01" },
      { amountJpy: 3000, categoryName: "宿泊", date: "2026-06-02" },
      { amountJpy: 500, categoryName: "外食", date: "2026-06-03" },
    ];

    // When
    const result = totalByCategory(transactions);

    // Then
    expect(result.totals).toEqual([
      { label: "宿泊", totalJpy: 3000 },
      { label: "外食", totalJpy: 1500 },
    ]);
    expect(result.excludedCount).toBe(0);
  });

  it("Given カテゴリが未設定(null)の取引がある, When totalByCategory を呼ぶ, Then 「未分類」として集計する", () => {
    // Given
    const transactions: AggregatableTx[] = [
      { amountJpy: 1000, categoryName: null, date: "2026-06-01" },
      { amountJpy: 500, date: "2026-06-02" },
    ];

    // When
    const result = totalByCategory(transactions);

    // Then
    expect(result.totals).toEqual([{ label: "未分類", totalJpy: 1500 }]);
  });

  it("Given amountJpyが未確定(null)の取引が混ざる, When totalByCategory を呼ぶ, Then その取引は集計から除外しexcludedCountに計上する", () => {
    // Given
    const transactions: AggregatableTx[] = [
      { amountJpy: 1000, categoryName: "外食", date: "2026-06-01" },
      { amountJpy: null, categoryName: "外食", date: "2026-06-02" },
    ];

    // When
    const result = totalByCategory(transactions);

    // Then
    expect(result.totals).toEqual([{ label: "外食", totalJpy: 1000 }]);
    expect(result.excludedCount).toBe(1);
  });
});

describe("totalByAccount", () => {
  it("Given 複数口座の取引がある, When totalByAccount を呼ぶ, Then 口座ごとに合計する", () => {
    // Given
    const transactions: AggregatableTx[] = [
      { amountJpy: 1000, accountName: "Wise", date: "2026-06-01" },
      { amountJpy: 2000, accountName: "楽天カード", date: "2026-06-02" },
    ];

    // When
    const result = totalByAccount(transactions);

    // Then
    expect(result.totals).toEqual([
      { label: "楽天カード", totalJpy: 2000 },
      { label: "Wise", totalJpy: 1000 },
    ]);
  });

  it("Given 口座名が未設定の取引がある, When totalByAccount を呼ぶ, Then 「不明な口座」として集計する", () => {
    // Given
    const transactions: AggregatableTx[] = [{ amountJpy: 1000, date: "2026-06-01" }];

    // When
    const result = totalByAccount(transactions);

    // Then
    expect(result.totals).toEqual([{ label: "不明な口座", totalJpy: 1000 }]);
  });
});

describe("totalByCountry", () => {
  it("Given 複数国の取引がある, When totalByCountry を呼ぶ, Then 国ごとに合計する", () => {
    // Given
    const transactions: AggregatableTx[] = [
      { amountJpy: 1000, country: "メキシコ", date: "2026-06-01" },
      { amountJpy: 2000, country: "タイ", date: "2026-06-02" },
    ];

    // When
    const result = totalByCountry(transactions);

    // Then
    expect(result.totals).toEqual([
      { label: "タイ", totalJpy: 2000 },
      { label: "メキシコ", totalJpy: 1000 },
    ]);
  });

  it("Given 国が未設定の取引がある(国内カードの明細など), When totalByCountry を呼ぶ, Then 「不明」として集計する", () => {
    // Given
    const transactions: AggregatableTx[] = [{ amountJpy: 1000, date: "2026-06-01" }];

    // When
    const result = totalByCountry(transactions);

    // Then
    expect(result.totals).toEqual([{ label: "不明", totalJpy: 1000 }]);
  });
});

describe("totalByMonth", () => {
  it("Given 同じ月の異なる日付の取引が複数ある, When totalByMonth を呼ぶ, Then 年月(YYYY-MM)単位で合計する", () => {
    // Given
    const transactions: AggregatableTx[] = [
      { amountJpy: 1000, date: "2026-06-01" },
      { amountJpy: 500, date: "2026-06-30" },
      { amountJpy: 2000, date: "2026-07-01" },
    ];

    // When
    const result = totalByMonth(transactions);

    // Then
    expect(result.totals).toEqual([
      { label: "2026-07", totalJpy: 2000 },
      { label: "2026-06", totalJpy: 1500 },
    ]);
  });
});
