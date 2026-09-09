import { describe, expect, it } from "vitest";
import { rakutenAdapter } from "./rakuten";

const HEADER =
  '"利用日","利用店名・商品名","利用者","支払方法","利用金額","手数料/利息","支払総額","7月支払金額","当月請求額","8月繰越残高","新規サイン"';

describe("楽天カードCSVアダプター(楽天e-NAVI)", () => {
  it("Given ヘッダー行と通常の国内利用行, When parse する, Then ヘッダーを除外して取引を正規化する", () => {
    // Given
    const csv = [
      HEADER,
      '"2026/06/21","ｴﾂｸｽｻ-ﾊﾞ-","本人","1回払い","13200","0","13200","13200","13200","0","*"',
    ].join("\n");

    // When
    const result = rakutenAdapter.parse(csv);

    // Then
    expect(result).toEqual([
      {
        date: "2026-06-21",
        merchant: "ｴﾂｸｽｻ-ﾊﾞ-",
        amountOriginal: 13200,
        currencyOriginal: "JPY",
        amountJpy: 13200,
      },
    ]);
  });

  it("Given 海外利用行の直後に現地利用額の内訳行(利用日が空欄)が続く, When parse する, Then 内訳行は取引として計上しない", () => {
    // Given
    const csv = [
      HEADER,
      '"2026/06/11","AIRBNB * HMX3TXKCBE利用国GB","本人","1回払い","9826","0","9826","9826","9826","0","*"',
      '"","現地利用額　　　　　　９８２６．０００変換レート　　　１．０００円","","","","","","","","",""',
    ].join("\n");

    // When
    const result = rakutenAdapter.parse(csv);

    // Then
    expect(result).toHaveLength(1);
    expect(result[0].merchant).toBe("AIRBNB * HMX3TXKCBE利用国GB");
  });

  it("Given 楽天カード明細と分かるヘッダーを含まないCSV, When detect する, Then falseを返す", () => {
    // Given / When / Then
    expect(rakutenAdapter.detect("これは別のCSVです")).toBe(false);
  });
});
