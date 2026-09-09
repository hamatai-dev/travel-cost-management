import { describe, expect, it } from "vitest";
import { isDuplicateCategoryName } from "./isDuplicateCategoryName";

describe("isDuplicateCategoryName", () => {
  it("Given 既存カテゴリ名と完全一致する名前, When isDuplicateCategoryName を呼ぶ, Then trueを返す", () => {
    expect(isDuplicateCategoryName("外食", ["食費", "外食", "交通"])).toBe(true);
  });

  it("Given 大文字小文字だけ違う名前, When isDuplicateCategoryName を呼ぶ, Then 大文字小文字を無視してtrueを返す", () => {
    expect(isDuplicateCategoryName("cafe", ["食費", "Cafe"])).toBe(true);
  });

  it("Given 前後に空白がある名前, When isDuplicateCategoryName を呼ぶ, Then trimして比較しtrueを返す", () => {
    expect(isDuplicateCategoryName("  外食  ", ["外食"])).toBe(true);
  });

  it("Given 既存にない新しい名前, When isDuplicateCategoryName を呼ぶ, Then falseを返す", () => {
    expect(isDuplicateCategoryName("お土産", ["食費", "外食", "交通"])).toBe(false);
  });
});
