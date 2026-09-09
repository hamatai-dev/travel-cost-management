import { describe, expect, it } from "vitest";
import { wiseAdapter } from "./wise";

const HEADER =
  "ID,ステータス,送金の種類,作成日,完了日,送金手数料,送金手数料の通貨,受取手数料,受取手数料の通貨,送金元通貨,送金額（手数料差し引き後）,送金元通貨,送金先,受取額（手数料差し引き後）,受取通貨,為替レート,備考,バッチ,作成者,カテゴリ,備考";

describe("Wise取引履歴CSVアダプター", () => {
  it("Given 完了したカード支払い(CARD_TRANSACTION/COMPLETED/OUT)で既存カテゴリ付き, When parse する, Then カテゴリとメモを引き継いで正規化する", () => {
    // Given
    const csv = [
      HEADER,
      '"CARD_TRANSACTION-1",COMPLETED,OUT,"2026-09-08 01:13:14","2026-09-08 01:13:14",0.00,MXN,,,"TAISHI HAMANO",88.00,MXN,"Sazonmixe - Mercado Pago",88.00,MXN,1.0000000000000000,,,"TAISHI HAMANO",食料品,"Queso fundidos"',
    ].join("\n");

    // When
    const result = wiseAdapter.parse(csv);

    // Then
    expect(result).toEqual([
      {
        date: "2026-09-08",
        merchant: "Sazonmixe - Mercado Pago",
        memo: "Queso fundidos",
        amountOriginal: 88,
        currencyOriginal: "MXN",
        category: "食料品",
      },
    ]);
  });

  it("Given 口座への入金(チャージ, TRANSFER種別のIN), When parse する, Then 支出として計上しない", () => {
    // Given
    const csv = [
      HEADER,
      'TRANSFER-1,COMPLETED,IN,"2026-08-28 18:48:10","2026-08-28 18:48:17",,,,,"masashi ieki",350.0,MXN,"TAISHI HAMANO",350.0,MXN,1,,,,チャージ,',
    ].join("\n");

    // When
    const result = wiseAdapter.parse(csv);

    // Then
    expect(result).toEqual([]);
  });

  it("Given ステータスがCOMPLETEDでないカード取引(REFUNDEDなど), When parse する, Then 支出として計上しない", () => {
    // Given
    const csv = [
      HEADER,
      '"CARD_TRANSACTION-2",REFUNDED,OUT,"2026-08-01 10:00:00","2026-08-01 10:00:00",0.00,MXN,,,"TAISHI HAMANO",50.00,MXN,"Some Shop",50.00,MXN,1.0,,,"TAISHI HAMANO",外食,',
    ].join("\n");

    // When
    const result = wiseAdapter.parse(csv);

    // Then
    expect(result).toEqual([]);
  });

  it("Given Wiseの明細と分かるヘッダーを含まないCSV, When detect する, Then falseを返す", () => {
    // Given / When / Then
    expect(wiseAdapter.detect("これは別のCSVです")).toBe(false);
  });
});
