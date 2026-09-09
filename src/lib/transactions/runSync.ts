import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveCashAccountId } from "@/lib/accounts/supabaseCashAccount";
import { resolveCategoryIdByName } from "@/lib/categories/supabaseCategories";
import {
  listPendingTransactions,
  markTransactionSynced,
  type LocalDatabase,
} from "@/lib/db/localDb";
import { createSupabaseInsert } from "./supabaseSync";
import { syncPendingTransactions, type SyncResult } from "./sync";

/**
 * ローカルDBに溜まった未同期の現金入力をSupabaseへ送る。
 * オンライン復帰時・アプリ起動時・保存直後のいずれからも呼び出される想定。
 */
export async function runCashTransactionSync(
  supabase: SupabaseClient,
  db: LocalDatabase,
  userId: string,
): Promise<SyncResult> {
  const accountId = await resolveCashAccountId(supabase, userId);

  const insert = createSupabaseInsert(supabase, {
    userId,
    accountId,
    resolveCategoryId: (name) =>
      resolveCategoryIdByName(supabase, userId, name),
  });

  return syncPendingTransactions({
    listPending: () => listPendingTransactions(db),
    insert,
    markSynced: (clientUuid, syncedAt) =>
      markTransactionSynced(db, clientUuid, syncedAt),
  });
}
