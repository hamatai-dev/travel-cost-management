import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * インポートバッチを先に作成し、そのIDを返す。取引行にこのIDを紐付けることで、
 * 後から「このインポートを丸ごと取り消す」ことができるようにする。
 * 件数は取引の挿入が終わってから updateImportBatchRowCount で確定させる。
 */
export async function createImportBatch(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
  fileName: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("import_batches")
    .insert({ user_id: userId, account_id: accountId, file_name: fileName, row_count: 0 })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`インポート履歴の記録に失敗しました: ${error?.message}`);
  }
  return data.id;
}

export async function updateImportBatchRowCount(
  supabase: SupabaseClient,
  batchId: string,
  rowCount: number,
): Promise<void> {
  const { error } = await supabase
    .from("import_batches")
    .update({ row_count: rowCount })
    .eq("id", batchId);
  if (error) {
    throw new Error(`インポート履歴の更新に失敗しました: ${error.message}`);
  }
}
