export interface SortableById {
  id: string;
}

/**
 * カテゴリ一覧を、ユーザーが指定した並び順(あれば)で並べ替える。
 * 並び順が指定されているものは昇順で先頭に、指定されていないものは
 * (安定ソートにより)元の相対順序を保ったまま後ろに続く。
 */
export function sortCategoriesByPreference<T extends SortableById>(
  categories: T[],
  sortOrderMap: Map<string, number>,
): T[] {
  return [...categories].sort((a, b) => {
    const orderA = sortOrderMap.get(a.id);
    const orderB = sortOrderMap.get(b.id);

    if (orderA != null && orderB != null) return orderA - orderB;
    if (orderA != null) return -1;
    if (orderB != null) return 1;
    return 0;
  });
}
