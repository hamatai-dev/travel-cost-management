/**
 * 新しいカテゴリ名が、既存のカテゴリ名(デフォルト+自分のカスタム分)と
 * 重複していないかを判定する。大文字小文字・前後空白の違いは同一とみなす。
 */
export function isDuplicateCategoryName(
  name: string,
  existingNames: string[],
): boolean {
  const normalized = name.trim().toLowerCase();
  return existingNames.some((n) => n.trim().toLowerCase() === normalized);
}
