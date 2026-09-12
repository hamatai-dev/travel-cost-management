import { format, subDays } from "date-fns";
import { COMMON_CURRENCIES } from "@/lib/currency/commonCurrencies";
import { computeCurrencyTrend, type CurrencyTrend } from "./currencyTrend";
import { fetchJpyRate } from "./fetchRate";

/**
 * 通貨セレクトに出している主要通貨(JPYを除く)それぞれについて、
 * 「直近1週間でレートがどう動いたか」の一覧を組み立てる。
 * レートが取得できなかった通貨は結果から静かに除外する
 * (この機能はあくまで補助的な一覧表示なので、一部取れなくても表示自体は続ける)。
 */
export async function runCurrencyTrends(
  today: Date = new Date(),
): Promise<CurrencyTrend[]> {
  const todayStr = format(today, "yyyy-MM-dd");
  const weekAgoStr = format(subDays(today, 7), "yyyy-MM-dd");
  const currencies = COMMON_CURRENCIES.map((c) => c.code).filter((code) => code !== "JPY");

  const results = await Promise.all(
    currencies.map(async (currency) => {
      const [currentRateJpy, previousRateJpy] = await Promise.all([
        fetchJpyRate(todayStr, currency),
        fetchJpyRate(weekAgoStr, currency),
      ]);
      if (currentRateJpy == null || previousRateJpy == null) return null;
      return computeCurrencyTrend(currency, currentRateJpy, previousRateJpy);
    }),
  );

  return results.filter((r): r is CurrencyTrend => r != null);
}
