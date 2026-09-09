import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionType } from "@/types/transaction";
import { fetchAccountNameMap, fetchCategoryNameMap } from "./supabaseTransactions";
import { buildTransactionsCsv } from "./buildTransactionsCsv";

const EXPORT_PAGE_SIZE = 1000;

/**
 * ユーザーの全取引をCSVテキストとして書き出す(バックアップ用)。
 * 1000件ずつページングして全件取得してからCSVに変換する。
 */
export async function exportTransactionsCsv(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
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
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "date, merchant, amount_original, currency_original, amount_jpy, category_id, account_id, country, memo, source, transaction_type",
      )
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .range(from, from + EXPORT_PAGE_SIZE - 1);

    if (error) throw new Error(`取引の取得に失敗しました: ${error.message}`);
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < EXPORT_PAGE_SIZE) break;
    from += EXPORT_PAGE_SIZE;
  }

  return buildTransactionsCsv(
    rows.map((r) => ({
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
    })),
  );
}
