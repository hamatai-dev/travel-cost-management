import { describe, expect, it } from "vitest";
import { computeAmountJpyOnEdit } from "./computeAmountJpyOnEdit";

describe("computeAmountJpyOnEdit", () => {
  it("Given 編集後の通貨がJPY, When computeAmountJpyOnEdit を呼ぶ, Then 即座に確定しレート1として返す", () => {
    // Given / When
    const result = computeAmountJpyOnEdit("JPY", 1500);

    // Then
    expect(result).toEqual({ amountJpy: 1500, fxRate: 1 });
  });

  it("Given 編集後の通貨が外貨(例: USD), When computeAmountJpyOnEdit を呼ぶ, Then 未確定(null)に戻し次回の集計時に再計算させる", () => {
    // Given / When
    const result = computeAmountJpyOnEdit("USD", 20);

    // Then: 古いレートのまま円換算額を引き継ぐと不正確になるため、あえて未確定に戻す
    expect(result).toEqual({ amountJpy: null, fxRate: null });
  });
});
