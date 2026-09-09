import { describe, expect, it } from "vitest";
import { requestPasswordResetSchema, updatePasswordSchema } from "./resetPasswordSchema";

describe("requestPasswordResetSchema", () => {
  it("Given 正しい形式のメールアドレス, When parse する, Then 検証を通過する", () => {
    // Given / When
    const result = requestPasswordResetSchema.safeParse({ email: "user@example.com" });

    // Then
    expect(result.success).toBe(true);
  });

  it("Given メールアドレスが空, When parse する, Then 「メールアドレスを入力してください」エラーになる", () => {
    // Given / When
    const result = requestPasswordResetSchema.safeParse({ email: "" });

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("メールアドレスを入力してください");
    }
  });

  it("Given メールアドレスの形式が不正, When parse する, Then 形式エラーになる", () => {
    // Given / When
    const result = requestPasswordResetSchema.safeParse({ email: "not-an-email" });

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("メールアドレスの形式が正しくありません");
    }
  });
});

describe("updatePasswordSchema", () => {
  it("Given 8文字以上のパスワードと一致する確認用パスワード, When parse する, Then 検証を通過する", () => {
    // Given / When
    const result = updatePasswordSchema.safeParse({
      password: "newpassword1",
      confirmPassword: "newpassword1",
    });

    // Then
    expect(result.success).toBe(true);
  });

  it("Given パスワードが8文字未満, When parse する, Then 「8文字以上で入力してください」エラーになる", () => {
    // Given / When
    const result = updatePasswordSchema.safeParse({
      password: "short1",
      confirmPassword: "short1",
    });

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("パスワードは8文字以上で入力してください");
    }
  });

  it("Given パスワードと確認用パスワードが一致しない, When parse する, Then 「パスワードが一致しません」エラーになる", () => {
    // Given / When
    const result = updatePasswordSchema.safeParse({
      password: "newpassword1",
      confirmPassword: "newpassword2",
    });

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("パスワードが一致しません");
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });
});
