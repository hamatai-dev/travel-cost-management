import { describe, expect, it } from "vitest";
import { computeMonthlyCashFlow, type CashFlowTx } from "./monthlyCashFlow";

describe("computeMonthlyCashFlow", () => {
  it("Given 同じ月に支出と収入が混在する, When computeMonthlyCashFlow を呼ぶ, Then 月ごとに収入・支出・収支(ネット)を計算する", () => {
    // Given
    const transactions: CashFlowTx[] = [
      { amountJpy: 300000, transactionType: "income", date: "2026-06-05" },
      { amountJpy: 1000, transactionType: "expense", date: "2026-06-01" },
      { amountJpy: 2000, transactionType: "expense", date: "2026-06-10" },
    ];

    // When
    const result = computeMonthlyCashFlow(transactions);

    // Then
    expect(result).toEqual([
      { month: "2026-06", incomeJpy: 300000, expenseJpy: 3000, netJpy: 297000 },
    ]);
  });

  it("Given 支出が収入を上回る月がある, When computeMonthlyCashFlow を呼ぶ, Then netJpyが負の値になる(赤字)", () => {
    // Given
    const transactions: CashFlowTx[] = [
      { amountJpy: 10000, transactionType: "income", date: "2026-06-01" },
      { amountJpy: 15000, transactionType: "expense", date: "2026-06-02" },
    ];

    // When
    const result = computeMonthlyCashFlow(transactions);

    // Then
    expect(result).toEqual([
      { month: "2026-06", incomeJpy: 10000, expenseJpy: 15000, netJpy: -5000 },
    ]);
  });

  it("Given 複数月にまたがる取引がある, When computeMonthlyCashFlow を呼ぶ, Then 古い月から新しい月の昇順で返す", () => {
    // Given
    const transactions: CashFlowTx[] = [
      { amountJpy: 1000, transactionType: "expense", date: "2026-07-01" },
      { amountJpy: 2000, transactionType: "expense", date: "2026-05-01" },
      { amountJpy: 3000, transactionType: "expense", date: "2026-06-01" },
    ];

    // When
    const result = computeMonthlyCashFlow(transactions);

    // Then
    expect(result.map((r) => r.month)).toEqual(["2026-05", "2026-06", "2026-07"]);
  });

  it("Given amountJpyが未確定(null)の取引が混ざる, When computeMonthlyCashFlow を呼ぶ, Then その取引は集計から除外する", () => {
    // Given
    const transactions: CashFlowTx[] = [
      { amountJpy: 1000, transactionType: "expense", date: "2026-06-01" },
      { amountJpy: null, transactionType: "income", date: "2026-06-02" },
    ];

    // When
    const result = computeMonthlyCashFlow(transactions);

    // Then
    expect(result).toEqual([
      { month: "2026-06", incomeJpy: 0, expenseJpy: 1000, netJpy: -1000 },
    ]);
  });

  it("Given 取引が1件もない, When computeMonthlyCashFlow を呼ぶ, Then 空配列を返す", () => {
    // Given / When
    const result = computeMonthlyCashFlow([]);

    // Then
    expect(result).toEqual([]);
  });
});
