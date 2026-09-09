import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionType } from "@/types/transaction";
import { applyTransactionFilters, type TransactionFilters } from "./applyTransactionFilters";
import { buildTransactionsCsv, type ExportableTransaction } from "./buildTransactionsCsv";
import { fetchAccountNameMap, fetchCategoryNameMap } from "./supabaseTransactions";

const EXPORT_PAGE_SIZE = 1000;

/**
 * フィルタ条件に一致する取引を全件(ページングして)取得し、エクスポート用の
 * 正規化済みレコードに変換する。CSV/PDFなど出力形式を問わず共通で使う。
 */
export async function fetchExportableTransactions(
  supabase: SupabaseClient,
  userId: string,
  filters: TransactionFilters = {},
): Promise<ExportableTransaction[]> {
  const [categoryNames, accountNames] = await Promise.all([
    fetchCategoryNameMap(supabase, userId),
    fetchAccountNameMap(supabase, userId),
  ]);

  const rows: {
    date: string;
    merchant: string | null;
    amount_original: number;
    currency_original: string;
    amount_jpy: number | null;
    category_id: string | null;
    account_id: string;
    country: string | null;
    memo: string | null;
    source: string;
    transaction_type: TransactionType;
  }[] = [];

  let from = 0;
  for (;;) {
    const baseQuery = supabase
      .from("transactions")
      .select(
        "date, merchant, amount_original, currency_original, amount_jpy, category_id, account_id, country, memo, source, transaction_type",
      )
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .range(from, from + EXPORT_PAGE_SIZE - 1);

    const { data, error } = await applyTransactionFilters(baseQuery, filters);

    if (error) throw new Error(`取引の取得に失敗しました: ${error.message}`);
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < EXPORT_PAGE_SIZE) break;
    from += EXPORT_PAGE_SIZE;
  }

  return rows.map((r) => ({
    date: r.date,
    merchant: r.merchant,
    amountOriginal: r.amount_original,
    currencyOriginal: r.currency_original,
    amountJpy: r.amount_jpy,
    categoryName: r.category_id ? (categoryNames.get(r.category_id) ?? "未分類") : "未分類",
    accountName: accountNames.get(r.account_id) ?? "不明",
    country: r.country,
    memo: r.memo,
    source: r.source,
    transactionType: r.transaction_type,
  }));
}

/**
 * フィルタ条件に一致する取引をCSVテキストとして書き出す。
 */
export async function exportTransactionsCsv(
  supabase: SupabaseClient,
  userId: string,
  filters: TransactionFilters = {},
): Promise<string> {
  const rows = await fetchExportableTransactions(supabase, userId, filters);
  return buildTransactionsCsv(rows);
}
