import { describe, expect, it } from "vitest";
import { computePieSlices } from "./pieChartSlices";

describe("computePieSlices", () => {
  it("Given 支出700・収入300(合計1000), When computePieSlices を呼ぶ, Then 割合と角度が比率通りに計算される", () => {
    // Given
    const items = [
      { label: "支出", value: 700 },
      { label: "収入", value: 300 },
    ];

    // When
    const result = computePieSlices(items);

    // Then: 支出は70%(0度〜252度)、収入は30%(252度〜360度)
    expect(result[0].label).toBe("支出");
    expect(result[0].percentage).toBeCloseTo(70);
    expect(result[0].startAngle).toBeCloseTo(0);
    expect(result[0].endAngle).toBeCloseTo(252);

    expect(result[1].label).toBe("収入");
    expect(result[1].percentage).toBeCloseTo(30);
    expect(result[1].startAngle).toBeCloseTo(252);
    expect(result[1].endAngle).toBeCloseTo(360);
  });

  it("Given 全項目の値が0(データなし), When computePieSlices を呼ぶ, Then ゼロ除算を避け全て0%を返す", () => {
    // Given
    const items = [
      { label: "支出", value: 0 },
      { label: "収入", value: 0 },
    ];

    // When
    const result = computePieSlices(items);

    // Then
    expect(result).toEqual([
      { label: "支出", value: 0, percentage: 0, startAngle: 0, endAngle: 0 },
      { label: "収入", value: 0, percentage: 0, startAngle: 0, endAngle: 0 },
    ]);
  });

  it("Given 項目が1つだけ, When computePieSlices を呼ぶ, Then 360度(100%)を占める", () => {
    // Given
    const items = [{ label: "支出", value: 500 }];

    // When
    const result = computePieSlices(items);

    // Then
    expect(result).toEqual([
      { label: "支出", value: 500, percentage: 100, startAngle: 0, endAngle: 360 },
    ]);
  });
});
