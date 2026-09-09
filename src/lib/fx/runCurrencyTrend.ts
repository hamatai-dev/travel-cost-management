import type { SupabaseClient } from "@supabase/supabase-js";
import { format, subDays } from "date-fns";
import { fetchLatestForeignLocation } from "@/lib/transactions/supabaseTransactions";
import { computeCurrencyTrend, type CurrencyTrend } from "./currencyTrend";
import { fetchJpyRate } from "./fetchRate";

export interface CurrencyTrendResult extends CurrencyTrend {
  country: string;
}

/**
 * 「今いる国の為替レート、直近1週間でどう動いたか」の一言サマリーを組み立てる。
 * 直近の取引から国・通貨を推定できない、またはレートが取得できない場合はnull
 * (この機能はあくまで補助的な一言表示なので、取れないときは静かに非表示にする)。
 */
export async function runCurrencyTrend(
  supabase: SupabaseClient,
  userId: string,
  today: Date = new Date(),
): Promise<CurrencyTrendResult | null> {
  const location = await fetchLatestForeignLocation(supabase, userId);
  if (!location) return null;

  const todayStr = format(today, "yyyy-MM-dd");
  const weekAgoStr = format(subDays(today, 7), "yyyy-MM-dd");

  const [currentRateJpy, previousRateJpy] = await Promise.all([
    fetchJpyRate(todayStr, location.currency),
    fetchJpyRate(weekAgoStr, location.currency),
  ]);

  if (currentRateJpy == null || previousRateJpy == null) return null;

  return {
    country: location.country,
    ...computeCurrencyTrend(location.currency, currentRateJpy, previousRateJpy),
  };
}
