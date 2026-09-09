import { describe, expect, it } from "vitest";
import { topFrequentValues } from "./topFrequentValues";

describe("topFrequentValues", () => {
  it("Given 複数回登場する値がある, When topFrequentValues を呼ぶ, Then 出現回数の多い順に返す", () => {
    // Given
    const values = ["MXN", "USD", "MXN", "MXN", "THB", "USD"];

    // When
    const result = topFrequentValues(values, 10);

    // Then
    expect(result).toEqual(["MXN", "USD", "THB"]);
  });

  it("Given limitを指定する, When topFrequentValues を呼ぶ, Then その件数までに絞る", () => {
    // Given
    const values = ["MXN", "MXN", "USD", "USD", "THB"];

    // When
    const result = topFrequentValues(values, 2);

    // Then
    expect(result).toEqual(["MXN", "USD"]);
  });

  it("Given 出現回数が同じ値が複数ある, When topFrequentValues を呼ぶ, Then 先に登場した方を優先する(安定した順序)", () => {
    // Given: THBとUSDはどちらも1回だけ登場、THBの方が先
    const values = ["THB", "USD"];

    // When
    const result = topFrequentValues(values, 10);

    // Then
    expect(result).toEqual(["THB", "USD"]);
  });

  it("Given 空文字列やnull/undefinedが混ざる, When topFrequentValues を呼ぶ, Then それらは候補から除外する", () => {
    // Given
    const values = ["Soriana", "", null, "Soriana", undefined, "  "];

    // When
    const result = topFrequentValues(values, 10);

    // Then
    expect(result).toEqual(["Soriana"]);
  });

  it("Given 前後に空白がある同じ店名, When topFrequentValues を呼ぶ, Then trimして同一の値として集計する", () => {
    // Given
    const values = ["Soriana", "  Soriana  ", "OXXO"];

    // When
    const result = topFrequentValues(values, 10);

    // Then
    expect(result).toEqual(["Soriana", "OXXO"]);
  });
});
