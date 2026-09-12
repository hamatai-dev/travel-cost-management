import { describe, expect, it } from "vitest";
import { contrastTextColor } from "./contrastTextColor";

describe("contrastTextColor", () => {
  it("Given 明るい背景色(白), When contrastTextColor を呼ぶ, Then 黒文字を返す", () => {
    // Given / When
    const result = contrastTextColor("#ffffff");

    // Then
    expect(result).toBe("#000000");
  });

  it("Given 暗い背景色(黒), When contrastTextColor を呼ぶ, Then 白文字を返す", () => {
    // Given / When
    const result = contrastTextColor("#000000");

    // Then
    expect(result).toBe("#ffffff");
  });

  it("Given 3桁省略形の暗い色, When contrastTextColor を呼ぶ, Then 白文字を返す", () => {
    // Given / When
    const result = contrastTextColor("#03a");

    // Then
    expect(result).toBe("#ffffff");
  });

  it("Given #なしの色コード, When contrastTextColor を呼ぶ, Then 正しく解釈して判定する", () => {
    // Given / When
    const result = contrastTextColor("ffff00");

    // Then
    expect(result).toBe("#000000");
  });

  it("Given 不正な形式の文字列, When contrastTextColor を呼ぶ, Then 黒文字にフォールバックする", () => {
    // Given / When
    const result = contrastTextColor("not-a-color");

    // Then
    expect(result).toBe("#000000");
  });
});
