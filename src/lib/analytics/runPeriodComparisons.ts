import type { SupabaseClient } from "@supabase/supabase-js";
import { format, startOfMonth, subMonths } from "date-fns";
import { fetchJpyRate } from "@/lib/fx/fetchRate";
import { persistResolvedAmounts } from "@/lib/fx/persistResolvedAmounts";
import { resolveMissingAmountsJpy } from "@/lib/fx/resolveMissingAmountsJpy";
import { fetchAllTransactions } from "@/lib/transactions/supabaseTransactions";
import { computePeriodComparisons, type PeriodComparisons } from "./periodComparison";

/**
 * 「先月比・先週比」の一言サマリーを出すため、選択中の期間フィルタとは独立に
 * 直近(先月初〜今日)の支出を取得して比較する。
 * この範囲は今月・先週・先週の対象範囲を全てカバーする最小限の取得幅になっている。
 */
export async function runPeriodComparisons(
  supabase: SupabaseClient,
  userId: string,
  today: Date = new Date(),
): Promise<PeriodComparisons> {
  const from = format(startOfMonth(subMonths(today, 1)), "yyyy-MM-dd");
  const to = format(today, "yyyy-MM-dd");

  const transactions = await fetchAllTransactions(supabase, userId, { from, to });
  const expenseTransactions = transactions.filter((t) => t.transaction_type === "expense");

  const resolved = await resolveMissingAmountsJpy(
    expenseTransactions.map((t) => ({
      id: t.id,
      amountJpy: t.amount_jpy,
      amountOriginal: t.amount_original,
      currencyOriginal: t.currency_original,
      date: t.date,
    })),
    fetchJpyRate,
  );

  if (resolved.length > 0) {
    await persistResolvedAmounts(supabase, resolved);
  }

  const resolvedById = new Map(resolved.map((r) => [r.id, r.amountJpy]));

  return computePeriodComparisons(
    expenseTransactions.map((t) => ({
      amountJpy: t.amount_jpy ?? resolvedById.get(t.id) ?? null,
      date: t.date,
    })),
    today,
  );
}
