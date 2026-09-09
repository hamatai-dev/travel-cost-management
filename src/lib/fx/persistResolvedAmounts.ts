import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResolvedTx } from "./resolveMissingAmountsJpy";

/**
 * 解決した円換算額をDBに書き戻し、次回以降の再計算を不要にする(キャッシュ)。
 * 1件ずつのUPDATEになるが、対象は「まだamount_jpyがnullの行」だけなので
 * 通常は一度解決すれば以後は0件になる。
 */
export async function persistResolvedAmounts(
  supabase: SupabaseClient,
  resolved: ResolvedTx[],
): Promise<void> {
  await Promise.all(
    resolved.map((r) =>
      supabase
        .from("transactions")
        .update({ amount_jpy: r.amountJpy, fx_rate: r.fxRate })
        .eq("id", r.id),
    ),
  );
}
