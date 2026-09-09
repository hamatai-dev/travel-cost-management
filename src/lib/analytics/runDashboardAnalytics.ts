import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchJpyRate } from "@/lib/fx/fetchRate";
import { persistResolvedAmounts } from "@/lib/fx/persistResolvedAmounts";
import { resolveMissingAmountsJpy } from "@/lib/fx/resolveMissingAmountsJpy";
import {
  fetchAccountNameMap,
  fetchAllTransactions,
  fetchCategoryNameMap,
  fetchFixedCostCategoryIds,
} from "@/lib/transactions/supabaseTransactions";
import {
  totalByAccount,
  totalByCategory,
  totalByCountry,
  totalByMonth,
  type AggregatableTx,
  type AggregationResult,
} from "./aggregate";
import {
  computeCountryDailyAverages,
  type CountryDailyAverage,
} from "./countryDailyAverage";
import type { DateRange } from "./dateRange";
import { computeMonthlyCashFlow, type MonthlyCashFlow } from "./monthlyCashFlow";

export interface DashboardData {
  transactionCount: number;
  totalJpy: number;
  fixedCostJpy: number;
  excludedCount: number;
  byCategory: AggregationResult;
  byAccount: AggregationResult;
  byCountry: AggregationResult;
  byMonth: AggregationResult;
  countryDailyAverages: CountryDailyAverage[];
  /** 収入合計(JPY)。収支(家計簿)機能: 支出とは別枠で集計する。 */
  totalIncomeJpy: number;
  /** 収支 = 収入 - 支出 */
  netJpy: number;
  byIncomeCategory: AggregationResult;
  monthlyCashFlow: MonthlyCashFlow[];
}

/**
 * ダッシュボード表示に必要な一連の処理をまとめる。
 * 1. 取引・口座名・カテゴリ名・固定費カテゴリを取得する(dateRangeで期間を絞れる)
 * 2. 円換算が未確定の取引だけ為替レートを取得して解決する
 * 3. 解決結果をDBに書き戻してキャッシュする(次回以降はAPIを呼ばない)
 * 4. カテゴリ/口座/国/月別に集計し、固定費・国別1日あたり支出も計算する
 */
export async function runDashboardAnalytics(
  supabase: SupabaseClient,
  userId: string,
  dateRange: DateRange = {},
): Promise<DashboardData> {
  const [transactions, accountNames, categoryNames, fixedCostCategoryIds] = await Promise.all([
    fetchAllTransactions(supabase, userId, dateRange),
    fetchAccountNameMap(supabase, userId),
    fetchCategoryNameMap(supabase, userId),
    fetchFixedCostCategoryIds(supabase, userId),
  ]);

  const resolved = await resolveMissingAmountsJpy(
    transactions.map((t) => ({
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

  const aggregatableAll = transactions.map((t) => ({
    amountJpy: t.amount_jpy ?? resolvedById.get(t.id) ?? null,
    categoryName: t.category_id ? categoryNames.get(t.category_id) : null,
    accountName: accountNames.get(t.account_id),
    country: t.country,
    date: t.date,
    transactionType: t.transaction_type,
  }));

  // 既存の支出集計(カテゴリ/口座/国/月別、固定費、国別1日あたり支出)は
  // 収入を混ぜると意味が変わってしまうため、支出のみを対象にする。
  const expenseAggregatable: AggregatableTx[] = aggregatableAll.filter(
    (t) => t.transactionType === "expense",
  );
  const incomeAggregatable: AggregatableTx[] = aggregatableAll.filter(
    (t) => t.transactionType === "income",
  );

  const byCategory = totalByCategory(expenseAggregatable);
  const byAccount = totalByAccount(expenseAggregatable);
  const byCountry = totalByCountry(expenseAggregatable);
  const byMonth = totalByMonth(expenseAggregatable);
  const countryDailyAverages = computeCountryDailyAverages(expenseAggregatable);
  const byIncomeCategory = totalByCategory(incomeAggregatable);

  const totalJpy = expenseAggregatable.reduce((sum, t) => sum + (t.amountJpy ?? 0), 0);
  const excludedCount = expenseAggregatable.filter((t) => t.amountJpy == null).length;
  const totalIncomeJpy = incomeAggregatable.reduce(
    (sum, t) => sum + (t.amountJpy ?? 0),
    0,
  );

  const fixedCostJpy = transactions.reduce((sum, t) => {
    if (
      t.transaction_type !== "expense" ||
      !t.category_id ||
      !fixedCostCategoryIds.has(t.category_id)
    ) {
      return sum;
    }
    const amountJpy = t.amount_jpy ?? resolvedById.get(t.id) ?? null;
    return sum + (amountJpy ?? 0);
  }, 0);

  const monthlyCashFlow = computeMonthlyCashFlow(
    aggregatableAll.map((t) => ({
      amountJpy: t.amountJpy,
      transactionType: t.transactionType,
      date: t.date,
    })),
  );

  return {
    transactionCount: expenseAggregatable.length,
    totalJpy,
    fixedCostJpy,
    excludedCount,
    byCategory,
    byAccount,
    byCountry,
    byMonth,
    countryDailyAverages,
    totalIncomeJpy,
    netJpy: totalIncomeJpy - totalJpy,
    byIncomeCategory,
    monthlyCashFlow,
  };
}
