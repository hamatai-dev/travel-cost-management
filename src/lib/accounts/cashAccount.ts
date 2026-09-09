import { getOrCreateAccountId } from "./resolveAccount";

export interface CashAccountDeps {
  findCashAccountId: () => Promise<string | null>;
  createCashAccount: () => Promise<string>;
}

/**
 * ユーザーの「現金」口座IDを取得する。まだ一度も現金入力をしたことがない
 * ユーザーのために、存在しなければその場で作成する(事前のセットアップ操作を
 * 挟まずに、いきなり現金入力から使い始められるようにするため)。
 * 判断ロジック本体は resolveAccount.ts の汎用版に委譲している。
 */
export async function getOrCreateCashAccountId(
  deps: CashAccountDeps,
): Promise<string> {
  return getOrCreateAccountId({
    findAccountId: deps.findCashAccountId,
    createAccount: deps.createCashAccount,
  });
}
