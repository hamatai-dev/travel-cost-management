import { describe, expect, it } from "vitest";
import { eposAdapter } from "./epos";

const SUMMARY_LINE =
  "月別ご利用明細　山田　太郎　様　ご利用期間：2026年1月から2026年8月　株式会社エポスカード,,,,,,,";
const HEADER_LINE =
  "種別（ショッピング、キャッシング、その他）,ご利用年月日,ご利用場所,ご利用内容,ご利用金額（キャッシングでは元金になります）,支払区分,お支払開始月,備考";

describe("エポスカードCSVアダプター", () => {
  it("Given サマリー行・ヘッダー行に続く国内ショッピング行, When parse する, Then 和暦風の日付をISO形式に変換して正規化する", () => {
    // Given
    const csv = [
      SUMMARY_LINE,
      HEADER_LINE,
      "ショッピング,2026年1月10日,モバイルスイカ,−,3000,1回払い,2026年2月,",
    ].join("\n");

    // When
    const result = eposAdapter.parse(csv);

    // Then
    expect(result).toEqual([
      {
        date: "2026-01-10",
        merchant: "モバイルスイカ",
        memo: undefined,
        amountOriginal: 3000,
        currencyOriginal: "JPY",
        amountJpy: 3000,
        fxRate: undefined,
      },
    ]);
  });

  it("Given 海外利用でレート情報が備考に付記された行, When parse する, Then 現地通貨額とレートを分離して保持する", () => {
    // Given
    const csv = [
      SUMMARY_LINE,
      HEADER_LINE,
      "ショッピング,2026年1月6日,ＧＩＴＨＵＢ，　ＩＮＣ．,−,1798,1回払い,2026年2月,USD11　(1USD=163.454545円 換算日2026年1月7日)",
    ].join("\n");

    // When
    const result = eposAdapter.parse(csv);

    // Then
    expect(result).toEqual([
      {
        date: "2026-01-06",
        merchant: "ＧＩＴＨＵＢ，　ＩＮＣ．",
        memo: undefined,
        amountOriginal: 11,
        currencyOriginal: "USD",
        amountJpy: 1798,
        fxRate: 163.454545,
      },
    ]);
  });

  it("Given サマリー行・ヘッダー行のみでショッピング行がない, When parse する, Then 空の配列を返す", () => {
    // Given
    const csv = [SUMMARY_LINE, HEADER_LINE].join("\n");

    // When
    const result = eposAdapter.parse(csv);

    // Then
    expect(result).toEqual([]);
  });

  it("Given エポスカードの明細と分かる文言を含まないCSV, When detect する, Then falseを返す", () => {
    // Given / When / Then
    expect(eposAdapter.detect("これは別のCSVです")).toBe(false);
  });
});
