import type { SupabaseClient } from "@supabase/supabase-js";
import type { LocalTransaction } from "@/types/localTransaction";
import type { InsertOutcome } from "./sync";

// Postgresのユニーク制約違反エラーコード。transactions テーブルの
// unique(user_id, dedupe_hash) に引っかかった = 既に同期済みとみなせる。
const UNIQUE_VIOLATION = "23505";

export function createSupabaseInsert(
  supabase: SupabaseClient,
  params: {
    userId: string;
    accountId: string;
    /** 取引ごとの categoryName(手入力時のカテゴリ選択)からカテゴリIDを引く */
    resolveCategoryId: (categoryName: string | undefined) => Promise<string | null>;
  },
) {
  return async (tx: LocalTransaction): Promise<InsertOutcome> => {
    const categoryId = await params.resolveCategoryId(tx.categoryName);
    const { error } = await supabase.from("transactions").insert({
      user_id: params.userId,
      account_id: params.accountId,
      category_id: categoryId,
      date: tx.date,
      merchant: tx.merchant,
      memo: tx.memo ?? null,
      amount_original: tx.amountOriginal,
      currency_original: tx.currencyOriginal,
      country: tx.country ?? null,
      city: tx.city ?? null,
      source: tx.source,
      transaction_type: tx.transactionType,
      dedupe_hash: tx.dedupeHash,
      client_uuid: tx.clientUuid,
    });

    if (!error) return "inserted";
    if (error.code === UNIQUE_VIOLATION) return "already_synced";
    return "failed";
  };
}
