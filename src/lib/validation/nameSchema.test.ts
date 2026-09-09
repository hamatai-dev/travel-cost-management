import { describe, expect, it } from "vitest";
import { createNameSchema } from "./nameSchema";

describe("createNameSchema", () => {
  it("Given 前後に空白がある正しい名前, When parseする, Then trimして成功する", () => {
    // Given
    const schema = createNameSchema("カテゴリ名");

    // When
    const result = schema.safeParse("  食費  ");

    // Then
    expect(result).toEqual({ success: true, data: "食費" });
  });

  it("Given 空白のみの名前, When parseする, Then ラベルを含むエラーメッセージで失敗する", () => {
    // Given
    const schema = createNameSchema("カテゴリ名");

    // When
    const result = schema.safeParse("   ");

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("カテゴリ名を入力してください");
    }
  });

  it("Given maxLengthを超える名前, When parseする, Then 文字数エラーで失敗する", () => {
    // Given
    const schema = createNameSchema("口座名", 5);

    // When
    const result = schema.safeParse("123456");

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("5文字以内で入力してください");
    }
  });

  it("Given ちょうどmaxLengthの名前, When parseする, Then 成功する", () => {
    // Given
    const schema = createNameSchema("口座名", 5);

    // When
    const result = schema.safeParse("12345");

    // Then
    expect(result.success).toBe(true);
  });
});
