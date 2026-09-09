import { describe, expect, it } from "vitest";
import { inferCategoryFromMerchant } from "./inferCategory";

describe("inferCategoryFromMerchant", () => {
  it("Given 店名に'AIRBNB'を含む, When inferCategoryFromMerchant を呼ぶ, Then 「宿泊」を返す", () => {
    expect(inferCategoryFromMerchant("AIRBNB * HMF5234DCM (LONDON )")).toBe(
      "宿泊",
    );
  });

  it("Given 店名に'STARBUCKS'を含む, When inferCategoryFromMerchant を呼ぶ, Then 「外食」を返す", () => {
    expect(
      inferCategoryFromMerchant("スタ−バツクス　コ−ヒ−　ジヤパンではなくSTARBUCKS COFFEE"),
    ).toBe("外食");
  });

  it("Given 店名に'UBER'を含む, When inferCategoryFromMerchant を呼ぶ, Then 「交通」を返す", () => {
    expect(inferCategoryFromMerchant("UBER *TRIP (8005928996 )")).toBe(
      "交通",
    );
  });

  it("Given 小文字の店名(例: 'airbnb'), When inferCategoryFromMerchant を呼ぶ, Then 大文字小文字を無視してマッチする", () => {
    expect(inferCategoryFromMerchant("airbnb rental tokyo")).toBe("宿泊");
  });

  it("Given どのルールにもマッチしない店名, When inferCategoryFromMerchant を呼ぶ, Then nullを返す(未分類のまま)", () => {
    expect(inferCategoryFromMerchant("マネーフォワードクラウド")).toBeNull();
  });
});
