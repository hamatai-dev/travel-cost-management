/**
 * 過去の値の一覧から、出現回数が多い順にユニークな値を返す
 * (現金入力で「よく使う通貨/店名/国」を候補として出すために使う)。
 * 出現回数が同じ場合は、先に登場した方を優先する(安定した順序にするため)。
 * 空文字列やnull/undefinedは候補にならないため除外する。
 */
export function topFrequentValues(
  values: Array<string | null | undefined>,
  limit: number,
): string[] {
  const counts = new Map<string, number>();
  const firstSeenOrder: string[] = [];

  for (const raw of values) {
    const value = raw?.trim();
    if (!value) continue;

    if (!counts.has(value)) {
      counts.set(value, 0);
      firstSeenOrder.push(value);
    }
    counts.set(value, counts.get(value)! + 1);
  }

  return firstSeenOrder
    .sort((a, b) => counts.get(b)! - counts.get(a)!)
    .slice(0, limit);
}
