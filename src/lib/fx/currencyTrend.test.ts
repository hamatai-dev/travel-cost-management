import { describe, expect, it } from "vitest";
import { classifyCurrencyTrend, computeCurrencyTrend } from "./currencyTrend";

describe("classifyCurrencyTrend", () => {
  it("Given 変化率が明確なプラス(1円あたりの通貨価値が上昇), When classifyCurrencyTrend を呼ぶ, Then 「円安」と判定する", () => {
    // Given / When
    const result = classifyCurrencyTrend(0.02);

    // Then
    expect(result).toBe("円安");
  });

  it("Given 変化率が明確なマイナス, When classifyCurrencyTrend を呼ぶ, Then 「円高」と判定する", () => {
    // Given / When
    const result = classifyCurrencyTrend(-0.02);

    // Then
    expect(result).toBe("円高");
  });

  it("Given 変化率がごくわずか(閾値未満), When classifyCurrencyTrend を呼ぶ, Then 「横ばい」と判定する", () => {
    // Given / When
    const result = classifyCurrencyTrend(0.0005);

    // Then
    expect(result).toBe("横ばい");
  });
});

describe("computeCurrencyTrend", () => {
  it("Given 先週より現在のレートが高い(THBが値上がり), When computeCurrencyTrend を呼ぶ, Then 変化率と「円安」向きを返す", () => {
    // Given / When
    const result = computeCurrencyTrend("THB", 4.2, 4.0);

    // Then: (4.2-4.0)/4.0 ≒ 0.05
    expect(result.currency).toBe("THB");
    expect(result.currentRateJpy).toBe(4.2);
    expect(result.previousRateJpy).toBe(4.0);
    expect(result.changeRate).toBeCloseTo(0.05);
    expect(result.direction).toBe("円安");
  });

  it("Given 基準時点のレートが0(データ異常), When computeCurrencyTrend を呼ぶ, Then ゼロ除算を避け変化率0(横ばい)を返す", () => {
    // Given / When
    const result = computeCurrencyTrend("THB", 4.2, 0);

    // Then
    expect(result.changeRate).toBe(0);
    expect(result.direction).toBe("横ばい");
  });
});
