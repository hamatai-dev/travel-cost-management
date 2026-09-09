import { describe, expect, it } from "vitest";
import { computePeriodComparisons, type ComparablePeriodTx } from "./periodComparison";

// 基準日: 2026-06-17(水)。
// 今月ここまで(06-01〜06-17) vs 先月の同じ日数分(05-01〜05-17)
// 今週ここまで(06-15〜06-17、月曜始まり) vs 先週の同じ曜日まで(06-08〜06-10)
const TODAY = new Date(2026, 5, 17);

describe("computePeriodComparisons", () => {
  it("Given 今月・先月それぞれの経過日数分に支出がある, When computePeriodComparisons を呼ぶ, Then 先月比(changeRate)を計算する", () => {
    // Given
    const transactions: ComparablePeriodTx[] = [
      { amountJpy: 12000, date: "2026-06-05" }, // 今月
      { amountJpy: 10000, date: "2026-05-05" }, // 先月(同じ日数分の範囲内)
    ];

    // When
    const result = computePeriodComparisons(transactions, TODAY);

    // Then: (12000-10000)/10000 = 0.2 (先月比+20%)
    expect(result.monthOverMonth).toEqual({
      currentJpy: 12000,
      previousJpy: 10000,
      changeRate: 0.2,
    });
  });

  it("Given 先月の範囲外(今月と同じ日数を超えた日付)の取引がある, When computePeriodComparisons を呼ぶ, Then 先月比の集計には含めない(経過日数を揃えるため)", () => {
    // Given
    const transactions: ComparablePeriodTx[] = [
      { amountJpy: 10000, date: "2026-05-05" }, // 先月の対象範囲内
      { amountJpy: 99999, date: "2026-05-25" }, // 先月でも06-17を超える日数分なので対象外
    ];

    // When
    const result = computePeriodComparisons(transactions, TODAY);

    // Then
    expect(result.monthOverMonth.previousJpy).toBe(10000);
  });

  it("Given 今週・先週それぞれに支出がある, When computePeriodComparisons を呼ぶ, Then 先週比(changeRate)を計算する", () => {
    // Given
    const transactions: ComparablePeriodTx[] = [
      { amountJpy: 3000, date: "2026-06-16" }, // 今週(月曜06-15〜今日06-17)
      { amountJpy: 6000, date: "2026-06-09" }, // 先週の同じ曜日まで(06-08〜06-10)
    ];

    // When
    const result = computePeriodComparisons(transactions, TODAY);

    // Then: (3000-6000)/6000 = -0.5 (先週比-50%)
    expect(result.weekOverWeek).toEqual({
      currentJpy: 3000,
      previousJpy: 6000,
      changeRate: -0.5,
    });
  });

  it("Given 先月・先週の支出が0(比較対象がない), When computePeriodComparisons を呼ぶ, Then changeRateはnull(比較不能)を返す", () => {
    // Given
    const transactions: ComparablePeriodTx[] = [{ amountJpy: 5000, date: "2026-06-16" }];

    // When
    const result = computePeriodComparisons(transactions, TODAY);

    // Then
    expect(result.monthOverMonth.changeRate).toBeNull();
    expect(result.weekOverWeek.changeRate).toBeNull();
  });

  it("Given amountJpyが未確定(null)の取引が混ざる, When computePeriodComparisons を呼ぶ, Then その取引は集計から除外する", () => {
    // Given
    const transactions: ComparablePeriodTx[] = [
      { amountJpy: 1000, date: "2026-06-16" },
      { amountJpy: null, date: "2026-06-16" },
    ];

    // When
    const result = computePeriodComparisons(transactions, TODAY);

    // Then
    expect(result.weekOverWeek.currentJpy).toBe(1000);
  });
});
