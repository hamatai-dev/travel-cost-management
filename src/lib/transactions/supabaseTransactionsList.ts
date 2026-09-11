import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionType } from "@/types/transaction";
import {
  applyTransactionFilters,
  type TransactionFilters,
} from "./applyTransactionFilters";
import { computeAmountJpyOnEdit } from "./computeAmountJpyOnEdit";
import { computeRange } from "./pagination";
import type { TransactionEditInput } from "./transactionEditSchema";

export interface TransactionListRow {
  id: string;
  date: string;
  merchant: string | null;
  memo: string | null;
  amount_original: number;
  currency_original: string;
  amount_jpy: number | null;
  country: string | null;
  category_id: string | null;
  account_id: string;
  transaction_type: TransactionType;
}

export interface TransactionListResult {
  rows: TransactionListRow[];
  totalCount: number;
}

export async function fetchTransactionsPage(
  supabase: SupabaseClient,
  userId: string,
  filters: TransactionFilters,
  page: number,
  pageSize: number,
): Promise<TransactionListResult> {
  const { from, to } = computeRange(page, pageSize);

  const baseQuery = supabase
    .from("transactions")
    .select(
      "id, date, merchant, memo, amount_original, currency_original, amount_jpy, country, category_id, account_id, transaction_type",
      { count: "exact" },
    )
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .range(from, to);

  const { data, error, count } = await applyTransactionFilters(
    baseQuery,
    filters,
  );

  if (error) throw new Error(`取引の取得に失敗しました: ${error.message}`);
  return { rows: data ?? [], totalCount: count ?? 0 };
}

export async function updateTransaction(
  supabase: SupabaseClient,
  id: string,
  input: TransactionEditInput,
): Promise<void> {
  const { amountJpy, fxRate } = computeAmountJpyOnEdit(
    input.currencyOriginal,
    input.amountOriginal,
  );

  const { error } = await supabase
    .from("transactions")
    .update({
      date: input.date,
      merchant: input.merchant,
      amount_original: input.amountOriginal,
      currency_original: input.currencyOriginal,
      category_id: input.categoryId,
      memo: input.memo || null,
      country: input.country || null,
      city: input.city || null,
      transaction_type: input.transactionType,
      amount_jpy: amountJpy,
      fx_rate: fxRate,
    })
    .eq("id", id);

  if (error) throw new Error(`取引の更新に失敗しました: ${error.message}`);
}

export async function updateTransactionCategory(
  supabase: SupabaseClient,
  id: string,
  categoryId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .update({ category_id: categoryId })
    .eq("id", id);

  if (error) throw new Error(`カテゴリの更新に失敗しました: ${error.message}`);
}

export async function deleteTransactions(
  supabase: SupabaseClient,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("transactions")
    .delete()
    .in("id", ids);
  if (error) throw new Error(`取引の削除に失敗しました: ${error.message}`);
}
