export interface TxToResolve {
  id: string;
  amountJpy: number | null;
  amountOriginal: number;
  currencyOriginal: string;
  date: string;
}

export interface ResolvedTx {
  id: string;
  amountJpy: number;
  fxRate: number | null;
}

/**
 * まとめて未確定の円換算額を解決する(ダッシュボード表示前などに使う)。
 * 同じ日付・同じ通貨のレートはAPI呼び出しを1回にまとめて使い回す
 * (例: 同じ日にMXNの取引が10件あってもレート取得は1回で済む)。
 * レート取得に失敗した分は結果に含めず、次回また解決を試みられるようにする。
 */
export async function resolveMissingAmountsJpy(
  transactions: TxToResolve[],
  fetchRate: (date: string, currency: string) => Promise<number | null>,
): Promise<ResolvedTx[]> {
  const rateCache = new Map<string, number | null>();
  const resolved: ResolvedTx[] = [];

  for (const tx of transactions) {
    if (tx.amountJpy != null) continue;

    if (tx.currencyOriginal === "JPY") {
      resolved.push({ id: tx.id, amountJpy: tx.amountOriginal, fxRate: 1 });
      continue;
    }

    const cacheKey = `${tx.date}|${tx.currencyOriginal}`;
    if (!rateCache.has(cacheKey)) {
      rateCache.set(cacheKey, await fetchRate(tx.date, tx.currencyOriginal));
    }
    const rate = rateCache.get(cacheKey) ?? null;
    if (rate == null) continue;

    resolved.push({
      id: tx.id,
      amountJpy: Math.round(tx.amountOriginal * rate),
      fxRate: rate,
    });
  }

  return resolved;
}
