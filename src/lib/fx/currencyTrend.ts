export type CurrencyTrendDirection = "円安" | "円高" | "横ばい";

export interface CurrencyTrend {
  currency: string;
  currentRateJpy: number;
  previousRateJpy: number;
  changeRate: number; // (current - previous) / previous
  direction: CurrencyTrendDirection;
}

// これ未満の変化率は「横ばい」として扱う(レートは常に微妙に揺れるため、
// 一言サマリーとしてはノイズを拾いすぎないようにする)。
const FLAT_THRESHOLD = 0.001;

/**
 * 円建てレートの変化率から、円安/円高/横ばいを判定する。
 * その通貨1単位あたりの円換算額(currentRateJpy)が上がる = その通貨に対して
 * 円の価値が下がる = 円安、という向きになる。
 */
export function classifyCurrencyTrend(changeRate: number): CurrencyTrendDirection {
  if (changeRate > FLAT_THRESHOLD) return "円安";
  if (changeRate < -FLAT_THRESHOLD) return "円高";
  return "横ばい";
}

/**
 * 現在のレートと基準時点のレートから、通貨トレンド(変化率・向き)を計算する。
 */
export function computeCurrencyTrend(
  currency: string,
  currentRateJpy: number,
  previousRateJpy: number,
): CurrencyTrend {
  const changeRate =
    previousRateJpy > 0 ? (currentRateJpy - previousRateJpy) / previousRateJpy : 0;

  return {
    currency,
    currentRateJpy,
    previousRateJpy,
    changeRate,
    direction: classifyCurrencyTrend(changeRate),
  };
}
