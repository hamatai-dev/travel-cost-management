import { describe, expect, it } from "vitest";
import { computeDedupeHash } from "./dedupeHash";

describe("computeDedupeHash", () => {
  it("Given 同一のaccount/date/amount/merchant, When 2回ハッシュ計算する, Then 同じハッシュ値になる(再取込時の重複判定に使える)", () => {
    // Given / When
    const a = computeDedupeHash(
      "account-1",
      "2026-06-02",
      14665,
      "ＡＭＡＺＯＮ　ＷＥＢ",
    );
    const b = computeDedupeHash(
      "account-1",
      "2026-06-02",
      14665,
      "ＡＭＡＺＯＮ　ＷＥＢ",
    );

    // Then
    expect(a).toBe(b);
  });

  it("Given 店名の前後に空白差分がある同一取引, When ハッシュ計算する, Then 同じハッシュ値になる(trimして比較される)", () => {
    // Given / When
    const a = computeDedupeHash(
      "account-1",
      "2026-06-02",
      14665,
      "ＡＭＡＺＯＮ　ＷＥＢ",
    );
    const b = computeDedupeHash(
      "account-1",
      "2026-06-02",
      14665,
      "  ＡＭＡＺＯＮ　ＷＥＢ  ",
    );

    // Then
    expect(a).toBe(b);
  });

  it("Given 金額だけが異なる取引, When ハッシュ計算する, Then 異なるハッシュ値になる", () => {
    // Given / When
    const a = computeDedupeHash(
      "account-1",
      "2026-06-02",
      14665,
      "ＡＭＡＺＯＮ　ＷＥＢ",
    );
    const b = computeDedupeHash(
      "account-1",
      "2026-06-02",
      9999,
      "ＡＭＡＺＯＮ　ＷＥＢ",
    );

    // Then
    expect(a).not.toBe(b);
  });

  it("Given 口座(account_id)だけが異なる取引, When ハッシュ計算する, Then 異なるハッシュ値になる(口座間の同一金額を誤って重複扱いしない)", () => {
    // Given / When
    const a = computeDedupeHash(
      "account-1",
      "2026-06-02",
      14665,
      "ＡＭＡＺＯＮ　ＷＥＢ",
    );
    const b = computeDedupeHash(
      "account-2",
      "2026-06-02",
      14665,
      "ＡＭＡＺＯＮ　ＷＥＢ",
    );

    // Then
    expect(a).not.toBe(b);
  });
});
