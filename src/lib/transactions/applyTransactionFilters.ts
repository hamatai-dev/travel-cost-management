import type { TransactionType } from "@/types/transaction";

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  country?: string;
  dateFrom?: string;
  dateTo?: string;
  transactionType?: TransactionType;
  /** 店名・メモの部分一致検索 */
  search?: string;
}

// Supabaseのクエリビルダーはメソッドチェーンで自分自身(または派生した新しい
// ビルダー)を返す。ここではその形だけを最小限の型で表現し、実際の
// PostgrestFilterBuilder型に依存しないことでテストしやすくしている。
export interface FilterableQuery<T> {
  eq: (column: string, value: string) => T;
  gte: (column: string, value: string) => T;
  lte: (column: string, value: string) => T;
  or: (filters: string) => T;
}

// PostgRESTの or() 構文はカンマで条件を区切るため、検索語にカンマが含まれると
// 構文が壊れる。値をダブルクォートで囲むことで安全に埋め込む(公式に推奨される方法)。
function ilikeCondition(column: string, term: string): string {
  return `${column}.ilike."%${term}%"`;
}

/**
 * 一覧画面の絞り込み条件をSupabaseクエリに適用する。
 * 指定されていない条件はスキップし、余計な絞り込みをかけない。
 */
export function applyTransactionFilters<T extends FilterableQuery<T>>(
  query: T,
  filters: TransactionFilters,
): T {
  let q = query;

  if (filters.accountId) q = q.eq("account_id", filters.accountId);
  if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
  if (filters.country) q = q.eq("country", filters.country);
  if (filters.transactionType) q = q.eq("transaction_type", filters.transactionType);
  if (filters.dateFrom) q = q.gte("date", filters.dateFrom);
  if (filters.dateTo) q = q.lte("date", filters.dateTo);
  if (filters.search) {
    q = q.or(
      `${ilikeCondition("merchant", filters.search)},${ilikeCondition("memo", filters.search)}`,
    );
  }

  return q;
}
