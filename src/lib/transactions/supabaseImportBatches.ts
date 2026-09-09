import type { SupabaseClient } from "@supabase/supabase-js";

export interface ImportBatchRow {
  id: string;
  file_name: string | null;
  row_count: number;
  imported_at: string;
  account_id: string;
}

export async function fetchImportBatches(
  supabase: SupabaseClient,
  userId: string,
): Promise<ImportBatchRow[]> {
  const { data, error } = await supabase
    .from("import_batches")
    .select("id, file_name, row_count, imported_at, account_id")
    .eq("user_id", userId)
    .order("imported_at", { ascending: false });

  if (error) throw new Error(`インポート履歴の取得に失敗しました: ${error.message}`);
  return data ?? [];
}

/**
 * インポートバッチを削除する。transactions.import_batch_id には
 * on delete cascade が設定されているため、このバッチで取り込んだ取引も
 * まとめて削除される(=「このインポートを取り消す」)。
 */
export async function deleteImportBatch(
  supabase: SupabaseClient,
  batchId: string,
): Promise<void> {
  const { error } = await supabase.from("import_batches").delete().eq("id", batchId);
  if (error) throw new Error(`インポート履歴の削除に失敗しました: ${error.message}`);
}
