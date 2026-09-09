export interface PageRange {
  from: number;
  to: number;
}

/**
 * ページ番号(1始まり)とページサイズから、Supabaseの .range() に渡す
 * 0始まりのfrom/toを計算する。pageが1未満の不正値は1に丸める。
 */
export function computeRange(page: number, pageSize: number): PageRange {
  const safePage = Math.max(1, Math.floor(page));
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}
