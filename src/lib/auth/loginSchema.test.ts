import { describe, expect, it } from "vitest";
import { loginSchema } from "./loginSchema";

describe("loginSchema", () => {
  it("Given 正しい形式のメールアドレスと8文字以上のパスワード, When parse する, Then 検証を通過する", () => {
    // Given
    const input = { email: "user@example.com", password: "password123" };

    // When
    const result = loginSchema.safeParse(input);

    // Then
    expect(result.success).toBe(true);
  });

  it("Given メールアドレスの前後に空白がある, When parse する, Then トリムされて検証を通過する", () => {
    // Given
    const input = { email: "  user@example.com  ", password: "password123" };

    // When
    const result = loginSchema.safeParse(input);

    // Then
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("Given メールアドレスが空, When parse する, Then 「メールアドレスを入力してください」エラーになる", () => {
    // Given
    const input = { email: "", password: "password123" };

    // When
    const result = loginSchema.safeParse(input);

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("メールアドレスを入力してください");
    }
  });

  it("Given メールアドレスの形式が不正(@がない), When parse する, Then 形式エラーになる", () => {
    // Given
    const input = { email: "not-an-email", password: "password123" };

    // When
    const result = loginSchema.safeParse(input);

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("メールアドレスの形式が正しくありません");
    }
  });

  it("Given パスワードが8文字未満, When parse する, Then 「8文字以上で入力してください」エラーになる", () => {
    // Given
    const input = { email: "user@example.com", password: "short1" };

    // When
    const result = loginSchema.safeParse(input);

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("パスワードは8文字以上で入力してください");
    }
  });
});
