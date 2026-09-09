import { describe, expect, it } from "vitest";
import {
  buildCashTransaction,
  InvalidCashTransactionError,
} from "./cashEntry";

describe("buildCashTransaction", () => {
  it("Given 金額と店名を入力する, When buildCashTransaction を呼ぶ, Then 現在日時をdateとしてJPY建ての取引を組み立てる", () => {
    // Given
    const now = new Date("2026-09-08T10:00:00.000Z");

    // When
    const result = buildCashTransaction(
      { amount: 500, merchant: "屋台のタコス" },
      now,
    );

    // Then
    expect(result).toMatchObject({
      date: "2026-09-08",
      merchant: "屋台のタコス",
      amountOriginal: 500,
      currencyOriginal: "JPY",
      source: "cash",
    });
    expect(result.clientUuid).toBeTruthy();
    expect(result.dedupeHash).toBe(result.clientUuid);
  });

  it("Given 日付を明示的に指定する, When buildCashTransaction を呼ぶ, Then 現在日時ではなく指定した日付を使う", () => {
    // Given
    const now = new Date("2026-09-08T10:00:00.000Z");

    // When
    const result = buildCashTransaction(
      { amount: 500, date: "2026-09-01" },
      now,
    );

    // Then
    expect(result.date).toBe("2026-09-01");
  });

  it("Given 店名を入力しない, When buildCashTransaction を呼ぶ, Then 店名は「現金支払い」になる", () => {
    // When
    const result = buildCashTransaction({ amount: 300 });

    // Then
    expect(result.merchant).toBe("現金支払い");
  });

  it("Given 店名・メモの前後に空白がある, When buildCashTransaction を呼ぶ, Then trimして保存する", () => {
    // When
    const result = buildCashTransaction({
      amount: 300,
      merchant: "  屋台  ",
      memo: "  タコス2個  ",
    });

    // Then
    expect(result.merchant).toBe("屋台");
    expect(result.memo).toBe("タコス2個");
  });

  it("Given 金額が0以下, When buildCashTransaction を呼ぶ, Then InvalidCashTransactionError を投げる", () => {
    // Given / When / Then
    expect(() => buildCashTransaction({ amount: 0 })).toThrow(
      InvalidCashTransactionError,
    );
    expect(() => buildCashTransaction({ amount: -100 })).toThrow(
      InvalidCashTransactionError,
    );
  });

  it("Given 金額が数値ではない(NaN), When buildCashTransaction を呼ぶ, Then InvalidCashTransactionError を投げる", () => {
    // Given / When / Then
    expect(() => buildCashTransaction({ amount: NaN })).toThrow(
      InvalidCashTransactionError,
    );
  });

  it("Given transactionTypeを指定しない, When buildCashTransaction を呼ぶ, Then 支出(expense)として組み立てる", () => {
    // When
    const result = buildCashTransaction({ amount: 500 });

    // Then
    expect(result.transactionType).toBe("expense");
  });

  it("Given transactionTypeにincomeを指定し店名も未入力, When buildCashTransaction を呼ぶ, Then 収入として組み立て店名は「収入」になる", () => {
    // When
    const result = buildCashTransaction({ amount: 100000, transactionType: "income" });

    // Then
    expect(result.transactionType).toBe("income");
    expect(result.merchant).toBe("収入");
  });
});
