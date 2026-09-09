export interface CategoryDeps {
  findCategoryIdByName: (name: string) => Promise<string | null>;
}

/**
 * カテゴリ名からカテゴリIDを引く。未指定・未知のカテゴリ名は「未分類」として
 * null を返す(取込・入力を止めない。カテゴリの割り当ては後から編集できる)。
 */
export async function resolveCategoryId(
  categoryName: string | undefined,
  deps: CategoryDeps,
): Promise<string | null> {
  if (!categoryName) return null;
  return deps.findCategoryIdByName(categoryName);
}
