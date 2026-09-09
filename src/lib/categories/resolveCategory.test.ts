import { describe, expect, it, vi } from "vitest";
import { resolveCategoryId } from "./resolveCategory";

describe("resolveCategoryId", () => {
  it("Given カテゴリ名が指定されていない, When resolveCategoryId を呼ぶ, Then nullを返し検索は行わない", async () => {
    // Given
    const findCategoryIdByName = vi.fn();

    // When
    const result = await resolveCategoryId(undefined, { findCategoryIdByName });

    // Then
    expect(result).toBeNull();
    expect(findCategoryIdByName).not.toHaveBeenCalled();
  });

  it("Given 指定したカテゴリ名がマスタに存在する, When resolveCategoryId を呼ぶ, Then そのカテゴリIDを返す", async () => {
    // Given
    const findCategoryIdByName = vi.fn().mockResolvedValue("category-food-id");

    // When
    const result = await resolveCategoryId("食費", { findCategoryIdByName });

    // Then
    expect(result).toBe("category-food-id");
    expect(findCategoryIdByName).toHaveBeenCalledWith("食費");
  });

  it("Given 指定したカテゴリ名がマスタに存在しない, When resolveCategoryId を呼ぶ, Then nullを返す(未分類扱い)", async () => {
    // Given
    const findCategoryIdByName = vi.fn().mockResolvedValue(null);

    // When
    const result = await resolveCategoryId("存在しないカテゴリ", {
      findCategoryIdByName,
    });

    // Then
    expect(result).toBeNull();
  });
});
