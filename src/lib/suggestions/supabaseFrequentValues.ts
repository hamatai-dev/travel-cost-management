import type { SupabaseClient } from "@supabase/supabase-js";
import { topFrequentValues } from "./topFrequentValues";

export type FrequentValueColumn = "merchant" | "currency_original" | "country";

/**
 * 直近の取引から、指定した列(店名/通貨/国)のよく使う値を取得する。
 * 現金入力フォームの入力補助(候補チップ)に使う。
 */
export async function fetchFrequentValues(
  supabase: SupabaseClient,
  userId: string,
  column: FrequentValueColumn,
  options: { limit?: number; sampleSize?: number } = {},
): Promise<string[]> {
  const { limit = 5, sampleSize = 100 } = options;

  const { data, error } = await supabase
    .from("transactions")
    .select(column)
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(sampleSize);

  if (error) throw new Error(`よく使う値の取得に失敗しました: ${error.message}`);

  const values = (data ?? []).map(
    (row) => (row as Record<string, string | null>)[column],
  );
  return topFrequentValues(values, limit);
}
