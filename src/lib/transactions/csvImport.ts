import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveCategoryIdByName } from "@/lib/categories/supabaseCategories";
import type { ImportRow } from "./buildImportRows";

export interface ImportOutcome {
  insertedCount: number;
  duplicateCount: number;
}

/**
 * インポート行をSupabaseへ一括投入する。
 * unique(user_id, dedupe_hash) への衝突は ignoreDuplicates で静かにスキップされ、
 * エラーにはならない(同じCSVの再インポート・期間が重複するCSVをそのまま許容する)。
 * .select("id") を付けているため、返ってくるのは実際に挿入された行だけになり、
 * 件数の差分で重複スキップ数を算出できる。
 */
export async function insertImportRows(
  supabase: SupabaseClient,
  userId: string,
  rows: ImportRow[],
  batchId: string,
): Promise<ImportOutcome> {
  if (rows.length === 0) return { insertedCount: 0, duplicateCount: 0 };

  // 同じカテゴリ名を行ごとに何度も引かないようにキャッシュする
  const categoryCache = new Map<string, string | null>();
  async function resolveCategory(name: string | undefined) {
    if (!name) return null;
    if (!categoryCache.has(name)) {
      categoryCache.set(name, await resolveCategoryIdByName(supabase, userId, name));
    }
    return categoryCache.get(name) ?? null;
  }

  const payload = [];
  for (const row of rows) {
    payload.push({
      user_id: userId,
      account_id: row.accountId,
      category_id: await resolveCategory(row.categoryName),
      date: row.date,
      merchant: row.merchant,
      memo: row.memo ?? null,
      amount_original: row.amountOriginal,
      currency_original: row.currencyOriginal,
      amount_jpy: row.amountJpy ?? null,
      fx_rate: row.fxRate ?? null,
      country: row.country ?? null,
      city: row.city ?? null,
      source: row.source,
      dedupe_hash: row.dedupeHash,
      import_batch_id: batchId,
    });
  }

  const { data, error } = await supabase
    .from("transactions")
    .upsert(payload, { onConflict: "user_id,dedupe_hash", ignoreDuplicates: true })
    .select("id");

  if (error) throw new Error(`インポートに失敗しました: ${error.message}`);

  const insertedCount = data?.length ?? 0;
  return { insertedCount, duplicateCount: rows.length - insertedCount };
}
