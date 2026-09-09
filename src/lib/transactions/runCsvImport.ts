import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveImportAccountId } from "@/lib/accounts/supabaseImportAccount";
import { applyCategoryInference } from "@/lib/categories/applyCategoryInference";
import { accountMetaForAdapter } from "@/lib/importers/accountMeta";
import type { ParseCsvResult } from "@/lib/importers";
import { buildImportRows } from "./buildImportRows";
import { insertImportRows, type ImportOutcome } from "./csvImport";
import { createImportBatch, updateImportBatchRowCount } from "./importBatch";

/**
 * パース済みCSVを実際にSupabaseへ取り込む一連の処理をまとめる。
 * 口座の解決(なければ作成)→取込バッチの作成→カテゴリ未設定分の推定→
 * 行の構築(バッチIDを付与)→一括upsert→バッチの件数確定、の順で行う。
 * バッチを先に作ってIDを取引行に持たせておくことで、後から
 * 「このインポートを丸ごと取り消す」操作ができるようにしている。
 */
export async function runCsvImport(
  supabase: SupabaseClient,
  userId: string,
  parsed: ParseCsvResult,
  fileName: string,
): Promise<ImportOutcome> {
  const meta = accountMetaForAdapter(parsed.adapter.id);
  const accountId = await resolveImportAccountId(
    supabase,
    userId,
    meta.name,
    meta.type,
  );

  const batchId = await createImportBatch(supabase, userId, accountId, fileName);

  const transactions = applyCategoryInference(parsed.transactions);
  const rows = buildImportRows(transactions, accountId);
  const outcome = await insertImportRows(supabase, userId, rows, batchId);
  await updateImportBatchRowCount(supabase, batchId, outcome.insertedCount);

  return outcome;
}
