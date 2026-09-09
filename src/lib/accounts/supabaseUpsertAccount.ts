import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountType } from "@/types/transaction";

// accounts(user_id, name, type) の unique 制約違反コード。
const UNIQUE_VIOLATION = "23505";

/**
 * 口座を作成する。「存在確認→作成」の間に別のリクエストが同じ名前+種別の
 * 口座を先に作ってしまう競合(例: ページ読み込み時の自動同期とオンライン復帰時の
 * 自動同期がほぼ同時に走り、どちらも「現金口座がない」と判定して2件作ってしまう)
 * が起きても、unique制約違反はエラーにせず既存の口座を取得して返す。
 */
export async function createOrFetchAccount(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  type: AccountType,
): Promise<string> {
  const { data, error } = await supabase
    .from("accounts")
    .insert({ user_id: userId, name, type })
    .select("id")
    .single();

  if (!error && data) return data.id;

  if (error?.code === UNIQUE_VIOLATION) {
    const { data: existing, error: fetchError } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("name", name)
      .eq("type", type)
      .single();
    if (!fetchError && existing) return existing.id;
  }

  throw new Error(`口座「${name}」の作成に失敗しました: ${error?.message}`);
}
