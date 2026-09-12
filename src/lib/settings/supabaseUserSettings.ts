import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * このユーザーの初期残高(JPY)を取得する。まだ設定していない場合は0を返す
 * (「現在の総残高」計算に必ず使うため、未設定でも呼び出し側を分岐させずに済む)。
 */
export async function fetchInitialBalance(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("initial_balance_jpy")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`初期残高の取得に失敗しました: ${error.message}`);
  return data?.initial_balance_jpy ?? 0;
}

export async function saveInitialBalance(
  supabase: SupabaseClient,
  userId: string,
  initialBalanceJpy: number,
): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .upsert(
      { user_id: userId, initial_balance_jpy: initialBalanceJpy },
      { onConflict: "user_id" },
    );

  if (error) throw new Error(`初期残高の保存に失敗しました: ${error.message}`);
}
