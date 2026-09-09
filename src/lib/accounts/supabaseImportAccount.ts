import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountType } from "@/types/transaction";
import { getOrCreateAccountId } from "./resolveAccount";
import { createOrFetchAccount } from "./supabaseUpsertAccount";

/**
 * CSVインポート先の口座(三井住友カード/エポスカード/楽天カード/Wiseなど)IDを
 * 取得する。初回インポート時はその場で口座を作成する。
 */
export async function resolveImportAccountId(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  type: AccountType,
): Promise<string> {
  return getOrCreateAccountId({
    findAccountId: async () => {
      const { data } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", userId)
        .eq("name", name)
        .eq("type", type)
        .limit(1)
        .maybeSingle();
      return data?.id ?? null;
    },
    createAccount: () => createOrFetchAccount(supabase, userId, name, type),
  });
}
