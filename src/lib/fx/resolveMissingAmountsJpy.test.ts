import { describe, expect, it, vi } from "vitest";
import { resolveMissingAmountsJpy, type TxToResolve } from "./resolveMissingAmountsJpy";

describe("resolveMissingAmountsJpy", () => {
  it("Given 既にamountJpyが確定している取引が混ざっている, When resolveMissingAmountsJpy を呼ぶ, Then 確定済みは結果に含めずAPIも呼ばない", async () => {
    // Given
    const transactions: TxToResolve[] = [
      { id: "1", amountJpy: 1000, amountOriginal: 1000, currencyOriginal: "JPY", date: "2026-06-01" },
    ];
    const fetchRate = vi.fn();

    // When
    const result = await resolveMissingAmountsJpy(transactions, fetchRate);

    // Then
    expect(result).toEqual([]);
    expect(fetchRate).not.toHaveBeenCalled();
  });

  it("Given 同じ日付・同じ通貨の未確定取引が複数ある, When resolveMissingAmountsJpy を呼ぶ, Then レート取得は1回だけ行い全件に使い回す", async () => {
    // Given
    const transactions: TxToResolve[] = [
      { id: "1", amountJpy: null, amountOriginal: 100, currencyOriginal: "MXN", date: "2026-09-01" },
      { id: "2", amountJpy: null, amountOriginal: 200, currencyOriginal: "MXN", date: "2026-09-01" },
      { id: "3", amountJpy: null, amountOriginal: 300, currencyOriginal: "MXN", date: "2026-09-01" },
    ];
    const fetchRate = vi.fn().mockResolvedValue(8);

    // When
    const result = await resolveMissingAmountsJpy(transactions, fetchRate);

    // Then
    expect(fetchRate).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      { id: "1", amountJpy: 800, fxRate: 8 },
      { id: "2", amountJpy: 1600, fxRate: 8 },
      { id: "3", amountJpy: 2400, fxRate: 8 },
    ]);
  });

  it("Given JPY建ての未確定取引, When resolveMissingAmountsJpy を呼ぶ, Then レート1として即座に解決しAPIを呼ばない", async () => {
    // Given
    const transactions: TxToResolve[] = [
      { id: "1", amountJpy: null, amountOriginal: 500, currencyOriginal: "JPY", date: "2026-09-08" },
    ];
    const fetchRate = vi.fn();

    // When
    const result = await resolveMissingAmountsJpy(transactions, fetchRate);

    // Then
    expect(result).toEqual([{ id: "1", amountJpy: 500, fxRate: 1 }]);
    expect(fetchRate).not.toHaveBeenCalled();
  });

  it("Given 一部の通貨でレート取得が失敗する, When resolveMissingAmountsJpy を呼ぶ, Then 失敗分は結果から除外し他の解決には影響しない", async () => {
    // Given
    const transactions: TxToResolve[] = [
      { id: "1", amountJpy: null, amountOriginal: 100, currencyOriginal: "XXX", date: "2026-09-01" },
      { id: "2", amountJpy: null, amountOriginal: 200, currencyOriginal: "USD", date: "2026-09-01" },
    ];
    const fetchRate = vi.fn(async (_date: string, currency: string) =>
      currency === "USD" ? 160 : null,
    );

    // When
    const result = await resolveMissingAmountsJpy(transactions, fetchRate);

    // Then
    expect(result).toEqual([{ id: "2", amountJpy: 32000, fxRate: 160 }]);
  });

  it("Given 同じ通貨でも日付が異なる取引がある, When resolveMissingAmountsJpy を呼ぶ, Then 日付ごとに別々にレートを取得する", async () => {
    // Given
    const transactions: TxToResolve[] = [
      { id: "1", amountJpy: null, amountOriginal: 100, currencyOriginal: "USD", date: "2026-09-01" },
      { id: "2", amountJpy: null, amountOriginal: 100, currencyOriginal: "USD", date: "2026-09-02" },
    ];
    const fetchRate = vi.fn(async (date: string) => (date === "2026-09-01" ? 150 : 160));

    // When
    const result = await resolveMissingAmountsJpy(transactions, fetchRate);

    // Then
    expect(fetchRate).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      { id: "1", amountJpy: 15000, fxRate: 150 },
      { id: "2", amountJpy: 16000, fxRate: 160 },
    ]);
  });
});
