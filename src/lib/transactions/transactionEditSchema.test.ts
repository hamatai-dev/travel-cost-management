import { describe, expect, it } from "vitest";
import { transactionEditSchema } from "./transactionEditSchema";

const VALID_INPUT = {
  date: "2026-06-02",
  merchant: "屋台のタコス",
  amountOriginal: 500,
  currencyOriginal: "jpy",
  categoryId: "11111111-1111-4111-8111-111111111111",
  transactionType: "expense",
  memo: "  夕食  ",
};

describe("transactionEditSchema", () => {
  it("Given 正しい入力, When parseする, Then 成功し各フィールドが正規化されて返る", () => {
    // Given / When
    const result = transactionEditSchema.safeParse(VALID_INPUT);

    // Then
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currencyOriginal).toBe("JPY"); // 大文字化される
      expect(result.data.memo).toBe("夕食"); // trimされる
    }
  });

  it("Given 金額が0以下, When parseする, Then エラーになる", () => {
    // Given / When
    const result = transactionEditSchema.safeParse({
      ...VALID_INPUT,
      amountOriginal: 0,
    });

    // Then
    expect(result.success).toBe(false);
  });

  it("Given 通貨コードが3文字でない, When parseする, Then エラーになる", () => {
    // Given / When
    const result = transactionEditSchema.safeParse({
      ...VALID_INPUT,
      currencyOriginal: "YEN",
    });

    // Then: "YEN"は3文字なので実は通る想定 → 4文字以上のケースで検証する
    expect(result.success).toBe(true);

    const tooLong = transactionEditSchema.safeParse({
      ...VALID_INPUT,
      currencyOriginal: "YENN",
    });
    expect(tooLong.success).toBe(false);
  });

  it("Given 店名が空白のみ, When parseする, Then trim後に空とみなしエラーになる", () => {
    // Given / When
    const result = transactionEditSchema.safeParse({
      ...VALID_INPUT,
      merchant: "   ",
    });

    // Then
    expect(result.success).toBe(false);
  });

  it("Given 日付の形式が不正(例: 2026/06/02), When parseする, Then エラーになる", () => {
    // Given / When
    const result = transactionEditSchema.safeParse({
      ...VALID_INPUT,
      date: "2026/06/02",
    });

    // Then
    expect(result.success).toBe(false);
  });

  it("Given categoryIdがnull(未分類), When parseする, Then 成功する", () => {
    // Given / When
    const result = transactionEditSchema.safeParse({
      ...VALID_INPUT,
      categoryId: null,
    });

    // Then
    expect(result.success).toBe(true);
  });

  it("Given transactionTypeがincome, When parseする, Then 成功する", () => {
    // Given / When
    const result = transactionEditSchema.safeParse({
      ...VALID_INPUT,
      transactionType: "income",
    });

    // Then
    expect(result.success).toBe(true);
  });

  it("Given transactionTypeが未定義の値, When parseする, Then エラーになる", () => {
    // Given / When
    const result = transactionEditSchema.safeParse({
      ...VALID_INPUT,
      transactionType: "transfer",
    });

    // Then
    expect(result.success).toBe(false);
  });
});
