import { describe, expect, it } from "vitest";
import { resolveMonthRange } from "./resolveMonthRange";

describe("resolveMonthRange", () => {
  it("Given 「2026-06」, When resolveMonthRange を呼ぶ, Then 6月1日〜6月30日の範囲を返す", () => {
    // Given / When
    const result = resolveMonthRange("2026-06");

    // Then
    expect(result).toEqual({ from: "2026-06-01", to: "2026-06-30" });
  });

  it("Given 空文字(未選択), When resolveMonthRange を呼ぶ, Then 絞り込みなし({})を返す", () => {
    // Given / When
    const result = resolveMonthRange("");

    // Then
    expect(result).toEqual({});
  });

  it("Given うるう年でない2月「2026-02」, When resolveMonthRange を呼ぶ, Then 28日までの範囲を返す", () => {
    // Given / When
    const result = resolveMonthRange("2026-02");

    // Then
    expect(result).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });

  it("Given うるう年の2月「2024-02」, When resolveMonthRange を呼ぶ, Then 29日までの範囲を返す", () => {
    // Given / When
    const result = resolveMonthRange("2024-02");

    // Then
    expect(result).toEqual({ from: "2024-02-01", to: "2024-02-29" });
  });
});
