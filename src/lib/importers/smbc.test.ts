import { describe, expect, it } from "vitest";
import { smbcAdapter } from "./smbc";

describe("三井住友カードCSVアダプター", () => {
  it("Given 名義・カード番号の行と通常の国内利用行, When parse する, Then 名義行を除外して取引を正規化する", () => {
    // Given
    const csv = [
      "山田　太郎　様,1234-56**-****-****,三井住友カードマスター（ＮＬ）",
      "2026/06/02,ＡＭＡＺＯＮ　ＷＥＢ　ＳＥＲＶＩＣＥＳ,14665,１,１,14665,",
    ].join("\n");

    // When
    const result = smbcAdapter.parse(csv);

    // Then
    expect(result).toEqual([
      {
        date: "2026-06-02",
        merchant: "ＡＭＡＺＯＮ　ＷＥＢ　ＳＥＲＶＩＣＥＳ",
        memo: undefined,
        amountOriginal: 14665,
        currencyOriginal: "JPY",
        amountJpy: 14665,
        fxRate: undefined,
      },
    ]);
  });

  it("Given 海外利用でレート情報が末尾列に付記された行, When parse する, Then 現地通貨額とレートを分離して保持する", () => {
    // Given
    const csv = [
      "山田　太郎　様,1234-56**-****-****,三井住友カードマスター（ＮＬ）",
      [
        "2026/06/10",
        "FRONTIER (DENVER )",
        "38886",
        "１",
        "１",
        "38886",
        "233.98　USD　166.195　06 11",
      ].join(","),
    ].join("\n");

    // When
    const result = smbcAdapter.parse(csv);

    // Then
    expect(result).toEqual([
      {
        date: "2026-06-10",
        merchant: "FRONTIER (DENVER )",
        memo: undefined,
        amountOriginal: 233.98,
        currencyOriginal: "USD",
        amountJpy: 38886,
        fxRate: 166.195,
      },
    ]);
  });

  it("Given 末尾の合計行(日付が空欄), When parse する, Then 取引として計上しない", () => {
    // Given
    const csv = [
      "山田　太郎　様,1234-56**-****-****,三井住友カードマスター（ＮＬ）",
      "2026/06/02,ＡＭＡＺＯＮ　ＷＥＢ　ＳＥＲＶＩＣＥＳ,14665,１,１,14665,",
      ",,,,,14665,",
    ].join("\n");

    // When
    const result = smbcAdapter.parse(csv);

    // Then
    expect(result).toHaveLength(1);
  });

  it("Given 返品によるマイナス金額の行, When parse する, Then マイナス金額のまま取引として保持し備考をmemoに残す", () => {
    // Given
    const csv = [
      "山田　太郎　様,1234-56**-****-****,三井住友カードマスター（ＮＬ）",
      "2026/06/08,ＡＮＡ　ＷＥＢ,211500,１,１,211500,",
      "2026/06/26,ＡＮＡ　ＷＥＢ,-211500,１,１,-211500,返品",
    ].join("\n");

    // When
    const result = smbcAdapter.parse(csv);

    // Then
    expect(result[1]).toMatchObject({
      amountOriginal: -211500,
      amountJpy: -211500,
      memo: "返品",
    });
  });

  it("Given 三井住友カードの明細と分かる文言を含まないCSV, When detect する, Then falseを返す", () => {
    // Given / When / Then
    expect(smbcAdapter.detect("これは別のCSVです")).toBe(false);
  });
});
