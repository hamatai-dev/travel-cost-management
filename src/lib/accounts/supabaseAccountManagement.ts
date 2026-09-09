import type { SupabaseClient } from "@supabase/supabase-js";
import type { Account } from "@/types/transaction";

export async function fetchAccounts(
  supabase: SupabaseClient,
  userId: string,
): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .order("type")
    .order("name");
  if (error) throw new Error(`口座の取得に失敗しました: ${error.message}`);
  return data ?? [];
}

export async function renameAccount(
  supabase: SupabaseClient,
  accountId: string,
  name: string,
): Promise<void> {
  const { error } = await supabase
    .from("accounts")
    .update({ name })
    .eq("id", accountId);
  if (error) throw new Error(`口座名の更新に失敗しました: ${error.message}`);
}
