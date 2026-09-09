export interface JpyResolutionInput {
  amountJpy: number | null;
  amountOriginal: number;
  currencyOriginal: string;
  date: string;
}

export interface JpyResolutionResult {
  amountJpy: number | null;
  fxRate: number | null;
}

/**
 * 1件の取引について円換算額を確定させる。
 * - 既に確定済み(amountJpyがある)ならAPIを呼ばずそのまま返す
 * - JPY建てならレート1として即座に確定する
 * - それ以外は指定した取得関数(実運用ではfetchJpyRate)でレートを引いて計算する
 */
export async function resolveAmountJpy(
  tx: JpyResolutionInput,
  fetchRate: (date: string, currency: string) => Promise<number | null>,
): Promise<JpyResolutionResult> {
  if (tx.amountJpy != null) {
    return { amountJpy: tx.amountJpy, fxRate: null };
  }

  if (tx.currencyOriginal === "JPY") {
    return { amountJpy: tx.amountOriginal, fxRate: 1 };
  }

  const rate = await fetchRate(tx.date, tx.currencyOriginal);
  if (rate == null) {
    return { amountJpy: null, fxRate: null };
  }

  return { amountJpy: Math.round(tx.amountOriginal * rate), fxRate: rate };
}
