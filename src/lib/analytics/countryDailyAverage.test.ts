import { describe, expect, it } from "vitest";
import {
  computeCountryDailyAverages,
  type CountryDailyAverageInput,
} from "./countryDailyAverage";

describe("computeCountryDailyAverages", () => {
  it("Given 同じ国で複数日にまたがる取引がある, When computeCountryDailyAverages を呼ぶ, Then 最初と最後の取引日の日数で割った1日あたり金額を返す", () => {
    // Given: 6/1〜6/10(10日間)で合計10万円使った
    const transactions: CountryDailyAverageInput[] = [
      { country: "メキシコ", date: "2026-06-01", amountJpy: 50000 },
      { country: "メキシコ", date: "2026-06-10", amountJpy: 50000 },
    ];

    // When
    const result = computeCountryDailyAverages(transactions);

    // Then
    expect(result).toEqual([
      { country: "メキシコ", totalJpy: 100000, days: 10, dailyAverageJpy: 10000 },
    ]);
  });

  it("Given 同じ国・同じ日に複数件の取引がある(1日だけの滞在), When computeCountryDailyAverages を呼ぶ, Then 日数は1として扱い0除算しない", () => {
    // Given
    const transactions: CountryDailyAverageInput[] = [
      { country: "タイ", date: "2026-07-01", amountJpy: 3000 },
      { country: "タイ", date: "2026-07-01", amountJpy: 2000 },
    ];

    // When
    const result = computeCountryDailyAverages(transactions);

    // Then
    expect(result).toEqual([
      { country: "タイ", totalJpy: 5000, days: 1, dailyAverageJpy: 5000 },
    ]);
  });

  it("Given 国が未設定(null)の取引がある, When computeCountryDailyAverages を呼ぶ, Then その取引は集計対象外にする", () => {
    // Given
    const transactions: CountryDailyAverageInput[] = [
      { country: null, date: "2026-06-01", amountJpy: 1000 },
      { country: "タイ", date: "2026-07-01", amountJpy: 2000 },
    ];

    // When
    const result = computeCountryDailyAverages(transactions);

    // Then
    expect(result).toEqual([
      { country: "タイ", totalJpy: 2000, days: 1, dailyAverageJpy: 2000 },
    ]);
  });

  it("Given amountJpyが未確定(null)の取引がある, When computeCountryDailyAverages を呼ぶ, Then 集計対象外にする", () => {
    // Given
    const transactions: CountryDailyAverageInput[] = [
      { country: "タイ", date: "2026-07-01", amountJpy: null },
    ];

    // When
    const result = computeCountryDailyAverages(transactions);

    // Then
    expect(result).toEqual([]);
  });

  it("Given 複数国のデータがある, When computeCountryDailyAverages を呼ぶ, Then 合計金額の降順で返す", () => {
    // Given
    const transactions: CountryDailyAverageInput[] = [
      { country: "タイ", date: "2026-07-01", amountJpy: 1000 },
      { country: "メキシコ", date: "2026-06-01", amountJpy: 5000 },
    ];

    // When
    const result = computeCountryDailyAverages(transactions);

    // Then
    expect(result.map((r) => r.country)).toEqual(["メキシコ", "タイ"]);
  });
});
