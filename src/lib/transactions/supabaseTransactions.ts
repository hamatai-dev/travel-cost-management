import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionType } from "@/types/transaction";

export interface RawTransactionRow {
  id: string;
  date: string;
  merchant: string | null;
  amount_original: number;
  currency_original: string;
  amount_jpy: number | null;
  country: string | null;
  category_id: string | null;
  account_id: string;
  transaction_type: TransactionType;
}

export async function fetchAllTransactions(
  supabase: SupabaseClient,
  userId: string,
  dateRange: { from?: string; to?: string } = {},
): Promise<RawTransactionRow[]> {
  let query = supabase
    .from("transactions")
    .select(
      "id, date, merchant, amount_original, currency_original, amount_jpy, country, category_id, account_id, transaction_type",
    )
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (dateRange.from) query = query.gte("date", dateRange.from);
  if (dateRange.to) query = query.lte("date", dateRange.to);

  const { data, error } = await query;

  if (error) throw new Error(`取引の取得に失敗しました: ${error.message}`);
  return data ?? [];
}

export async function fetchAccountNameMap(
  supabase: SupabaseClient,
  userId: string,
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name")
    .eq("user_id", userId);

  if (error) throw new Error(`口座の取得に失敗しました: ${error.message}`);
  return new Map((data ?? []).map((a) => [a.id, a.name]));
}

export async function fetchCategoryNameMap(
  supabase: SupabaseClient,
  userId: string,
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .or(`user_id.eq.${userId},user_id.is.null`);

  if (error) throw new Error(`カテゴリの取得に失敗しました: ${error.message}`);
  return new Map((data ?? []).map((c) => [c.id, c.name]));
}

export async function fetchFixedCostCategoryIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq("is_fixed_cost", true);

  if (error) throw new Error(`固定費カテゴリの取得に失敗しました: ${error.message}`);
  return new Set((data ?? []).map((c) => c.id));
}

export interface ForeignLocation {
  country: string;
  currency: string;
}

/**
 * 直近の取引から「今いる国」を推定する。country はカード会社によっては
 * 記録されないため、country・外貨(JPY以外)の両方が揃っている最新の取引を探す。
 */
export async function fetchLatestForeignLocation(
  supabase: SupabaseClient,
  userId: string,
): Promise<ForeignLocation | null> {
  const { data, error } = await supabase
    .from("transactions")
    .select("country, currency_original")
    .eq("user_id", userId)
    .not("country", "is", null)
    .neq("currency_original", "JPY")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`滞在国の取得に失敗しました: ${error.message}`);
  if (!data?.country || !data.currency_original) return null;

  return { country: data.country, currency: data.currency_original };
}
