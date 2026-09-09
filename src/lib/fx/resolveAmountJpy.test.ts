import { describe, expect, it, vi } from "vitest";
import { resolveAmountJpy } from "./resolveAmountJpy";

describe("resolveAmountJpy", () => {
  it("Given amountJpyが既にキャッシュ済み, When resolveAmountJpy を呼ぶ, Then 為替APIを呼ばずそのままの値を返す", async () => {
    // Given
    const fetchRate = vi.fn();

    // When
    const result = await resolveAmountJpy(
      {
        amountJpy: 14665,
        amountOriginal: 14665,
        currencyOriginal: "JPY",
        date: "2026-06-02",
      },
      fetchRate,
    );

    // Then
    expect(result).toEqual({ amountJpy: 14665, fxRate: null });
    expect(fetchRate).not.toHaveBeenCalled();
  });

  it("Given currencyOriginalがJPYで未確定, When resolveAmountJpy を呼ぶ, Then レート1として即座にamountOriginalをそのまま確定する", async () => {
    // Given
    const fetchRate = vi.fn();

    // When
    const result = await resolveAmountJpy(
      {
        amountJpy: null,
        amountOriginal: 500,
        currencyOriginal: "JPY",
        date: "2026-09-08",
      },
      fetchRate,
    );

    // Then
    expect(result).toEqual({ amountJpy: 500, fxRate: 1 });
    expect(fetchRate).not.toHaveBeenCalled();
  });

  it("Given 外貨建てでまだ未換算, When resolveAmountJpy を呼ぶ, Then レートを取得し金額×レートを四捨五入して確定する", async () => {
    // Given
    const fetchRate = vi.fn().mockResolvedValue(17.28);

    // When
    const result = await resolveAmountJpy(
      {
        amountJpy: null,
        amountOriginal: 88,
        currencyOriginal: "MXN",
        date: "2026-09-08",
      },
      fetchRate,
    );

    // Then
    expect(fetchRate).toHaveBeenCalledWith("2026-09-08", "MXN");
    expect(result).toEqual({ amountJpy: Math.round(88 * 17.28), fxRate: 17.28 });
  });

  it("Given 為替レートの取得に失敗する, When resolveAmountJpy を呼ぶ, Then nullを返し未確定のままにする(次回また試せる)", async () => {
    // Given
    const fetchRate = vi.fn().mockResolvedValue(null);

    // When
    const result = await resolveAmountJpy(
      {
        amountJpy: null,
        amountOriginal: 88,
        currencyOriginal: "MXN",
        date: "2026-09-08",
      },
      fetchRate,
    );

    // Then
    expect(result).toEqual({ amountJpy: null, fxRate: null });
  });
});
