import { describe, expect, it } from "vitest";
import { formatAuthError } from "./formatAuthError";

describe("formatAuthError", () => {
  it("Given code が over_email_send_rate_limit のエラー, When formatAuthError を呼ぶ, Then レート制限向けの日本語メッセージを返す", () => {
    // Given
    const error = { message: "email rate limit exceeded", code: "over_email_send_rate_limit" };

    // When
    const result = formatAuthError(error);

    // Then
    expect(result).toBe(
      "メール送信の回数制限に達しました。しばらく時間を置いてから再度お試しください。",
    );
  });

  it("Given codeはないがstatusが429のエラー, When formatAuthError を呼ぶ, Then レート制限向けの日本語メッセージを返す", () => {
    // Given
    const error = { message: "Too Many Requests", status: 429 };

    // When
    const result = formatAuthError(error);

    // Then
    expect(result).toBe(
      "メール送信の回数制限に達しました。しばらく時間を置いてから再度お試しください。",
    );
  });

  it("Given 既知のコードに該当しないエラー, When formatAuthError を呼ぶ, Then 元のメッセージをそのまま返す", () => {
    // Given
    const error = { message: "Invalid login credentials", code: "invalid_credentials" };

    // When
    const result = formatAuthError(error);

    // Then
    expect(result).toBe("Invalid login credentials");
  });
});
