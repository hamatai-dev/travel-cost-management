import { describe, expect, it } from "vitest";
import { truncateText } from "./truncateText";

describe("truncateText", () => {
  it("Given maxLengthちょうどの長さの文字列, When truncateText を呼ぶ, Then 省略記号は付かずそのまま返す", () => {
    // Given / When
    const result = truncateText("123456789012", 12);

    // Then
    expect(result).toBe("123456789012");
  });

  it("Given maxLengthを1文字超える文字列, When truncateText を呼ぶ, Then 先頭maxLength文字+「...」を返す", () => {
    // Given / When
    const result = truncateText("1234567890123", 12);

    // Then
    expect(result).toBe("123456789012...");
  });

  it("Given maxLengthより短い文字列, When truncateText を呼ぶ, Then そのまま返す", () => {
    // Given / When
    const result = truncateText("短いメモ", 12);

    // Then
    expect(result).toBe("短いメモ");
  });

  it("Given 空文字, When truncateText を呼ぶ, Then 空文字のまま返す", () => {
    // Given / When
    const result = truncateText("", 12);

    // Then
    expect(result).toBe("");
  });
});
