export interface AggregatableTx {
  amountJpy: number | null;
  categoryName?: string | null;
  accountName?: string | null;
  country?: string | null;
  date: string; // ISO 8601 (YYYY-MM-DD)
}

export interface Total {
  label: string;
  totalJpy: number;
}

export interface AggregationResult {
  totals: Total[];
  /** amountJpy が未確定(為替レート未取得)で集計から除外した件数 */
  excludedCount: number;
}

function aggregate(
  transactions: AggregatableTx[],
  keyOf: (tx: AggregatableTx) => string,
): AggregationResult {
  const sums = new Map<string, number>();
  let excludedCount = 0;

  for (const tx of transactions) {
    if (tx.amountJpy == null) {
      excludedCount += 1;
      continue;
    }
    const key = keyOf(tx);
    sums.set(key, (sums.get(key) ?? 0) + tx.amountJpy);
  }

  const totals = Array.from(sums, ([label, totalJpy]) => ({ label, totalJpy })).sort(
    (a, b) => b.totalJpy - a.totalJpy,
  );

  return { totals, excludedCount };
}

export function totalByCategory(transactions: AggregatableTx[]): AggregationResult {
  return aggregate(transactions, (tx) => tx.categoryName?.trim() || "未分類");
}

export function totalByAccount(transactions: AggregatableTx[]): AggregationResult {
  return aggregate(transactions, (tx) => tx.accountName?.trim() || "不明な口座");
}

export function totalByCountry(transactions: AggregatableTx[]): AggregationResult {
  return aggregate(transactions, (tx) => tx.country?.trim() || "不明");
}

export function totalByMonth(transactions: AggregatableTx[]): AggregationResult {
  return aggregate(transactions, (tx) => tx.date.slice(0, 7));
}
