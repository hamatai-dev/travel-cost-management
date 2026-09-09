import { describe, expect, it } from "vitest";
import { accountMetaForAdapter } from "./accountMeta";

describe("accountMetaForAdapter", () => {
  it("Given 三井住友カードのアダプターID, When accountMetaForAdapter を呼ぶ, Then 口座名「三井住友カード」・種別credit_cardを返す", () => {
    expect(accountMetaForAdapter("smbc")).toEqual({
      name: "三井住友カード",
      type: "credit_card",
    });
  });

  it("Given エポスカードのアダプターID, When accountMetaForAdapter を呼ぶ, Then 口座名「エポスカード」・種別credit_cardを返す", () => {
    expect(accountMetaForAdapter("epos")).toEqual({
      name: "エポスカード",
      type: "credit_card",
    });
  });

  it("Given 楽天カードのアダプターID, When accountMetaForAdapter を呼ぶ, Then 口座名「楽天カード」・種別credit_cardを返す", () => {
    expect(accountMetaForAdapter("rakuten")).toEqual({
      name: "楽天カード",
      type: "credit_card",
    });
  });

  it("Given WiseのアダプターID, When accountMetaForAdapter を呼ぶ, Then 口座名「Wise」・種別debit_cardを返す(クレジットカードと混同しない)", () => {
    expect(accountMetaForAdapter("wise")).toEqual({
      name: "Wise",
      type: "debit_card",
    });
  });
});
