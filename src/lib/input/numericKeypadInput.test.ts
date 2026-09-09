import { describe, expect, it } from "vitest";
import { appendKeypadDigit } from "./numericKeypadInput";

describe("appendKeypadDigit", () => {
  it("Given 空の状態, When 数字キー「5」を押す, Then 「5」になる", () => {
    // Given / When
    const result = appendKeypadDigit("", "5");

    // Then
    expect(result).toBe("5");
  });

  it("Given 「12」が入力済み, When 数字キー「3」を押す, Then 末尾に追加され「123」になる", () => {
    // Given / When
    const result = appendKeypadDigit("12", "3");

    // Then
    expect(result).toBe("123");
  });

  it("Given 「0」のみの状態, When 数字キー「5」を押す, Then 先頭の0は置き換えられ「5」になる(「05」にならない)", () => {
    // Given / When
    const result = appendKeypadDigit("0", "5");

    // Then
    expect(result).toBe("5");
  });

  it("Given 空の状態, When 「.」キーを押す, Then 「0.」になる", () => {
    // Given / When
    const result = appendKeypadDigit("", ".");

    // Then
    expect(result).toBe("0.");
  });

  it("Given 既に「.」を含む「12.5」, When 「.」キーを再度押す, Then 変化しない(小数点は1つまで)", () => {
    // Given / When
    const result = appendKeypadDigit("12.5", ".");

    // Then
    expect(result).toBe("12.5");
  });

  it("Given 「123」が入力済み, When backspaceキーを押す, Then 末尾の1文字が消え「12」になる", () => {
    // Given / When
    const result = appendKeypadDigit("123", "backspace");

    // Then
    expect(result).toBe("12");
  });

  it("Given 空の状態, When backspaceキーを押す, Then 空のまま変化しない", () => {
    // Given / When
    const result = appendKeypadDigit("", "backspace");

    // Then
    expect(result).toBe("");
  });

  it("Given 「123.45」が入力済み, When clearキーを押す, Then 空文字にリセットされる", () => {
    // Given / When
    const result = appendKeypadDigit("123.45", "clear");

    // Then
    expect(result).toBe("");
  });

  it("Given 10桁ちょうどの数字が入力済み, When さらに数字キーを押す, Then 上限を超えるため変化しない", () => {
    // Given
    const maxed = "1234567890";

    // When
    const result = appendKeypadDigit(maxed, "1");

    // Then
    expect(result).toBe(maxed);
  });
});
