import { describe, expect, it } from "vitest";
import { sortCategoriesByPreference } from "./sortCategoriesByPreference";

describe("sortCategoriesByPreference", () => {
  it("Given どのカテゴリにも並び順の指定がない, When sortCategoriesByPreference を呼ぶ, Then 元の順序のまま返す(安定ソート)", () => {
    // Given
    const categories = [{ id: "a" }, { id: "b" }, { id: "c" }];

    // When
    const result = sortCategoriesByPreference(categories, new Map());

    // Then
    expect(result.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("Given 一部のカテゴリにだけ並び順の指定がある, When sortCategoriesByPreference を呼ぶ, Then 指定されたものが昇順で先頭に来て、残りは元の相対順序を保つ", () => {
    // Given: c を最初に、a を2番目にしたい
    const categories = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    const sortOrderMap = new Map([
      ["c", 0],
      ["a", 1],
    ]);

    // When
    const result = sortCategoriesByPreference(categories, sortOrderMap);

    // Then: 指定順(c, a) → 未指定は元の相対順(b, d)
    expect(result.map((c) => c.id)).toEqual(["c", "a", "b", "d"]);
  });

  it("Given 全カテゴリに並び順の指定がある, When sortCategoriesByPreference を呼ぶ, Then その順序通りに並ぶ", () => {
    // Given
    const categories = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const sortOrderMap = new Map([
      ["a", 2],
      ["b", 0],
      ["c", 1],
    ]);

    // When
    const result = sortCategoriesByPreference(categories, sortOrderMap);

    // Then
    expect(result.map((c) => c.id)).toEqual(["b", "c", "a"]);
  });

  it("Given 元の配列, When sortCategoriesByPreference を呼ぶ, Then 元の配列自体は変更しない", () => {
    // Given
    const categories = [{ id: "a" }, { id: "b" }];

    // When
    sortCategoriesByPreference(categories, new Map([["b", 0]]));

    // Then
    expect(categories.map((c) => c.id)).toEqual(["a", "b"]);
  });
});
