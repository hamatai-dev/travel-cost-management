import type { SupabaseClient } from "@supabase/supabase-js";
import { getOrCreateCashAccountId } from "./cashAccount";
import { createOrFetchAccount } from "./supabaseUpsertAccount";

const CASH_ACCOUNT_NAME = "現金";

/**
 * ログイン中のユーザーの「現金」口座IDを取得する。存在しなければ作成する。
 * 判断ロジック自体は getOrCreateCashAccountId(純粋関数, テスト済み)に委譲し、
 * ここではSupabaseへの実際の問い合わせだけを行う。
 */
export async function resolveCashAccountId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  return getOrCreateCashAccountId({
    findCashAccountId: async () => {
      const { data } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "cash")
        .limit(1)
        .maybeSingle();
      return data?.id ?? null;
    },
    createCashAccount: () =>
      createOrFetchAccount(supabase, userId, CASH_ACCOUNT_NAME, "cash"),
  });
}
