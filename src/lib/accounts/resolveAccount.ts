export interface AccountResolutionDeps {
  findAccountId: () => Promise<string | null>;
  createAccount: () => Promise<string>;
}

/**
 * 「口座が存在すればそのID、なければ作成してそのID」という判断ロジック。
 * 現金口座(cashAccount.ts)・CSVインポート先のカード/デビット口座の両方で使う
 * 共通のfind-or-create処理。
 */
export async function getOrCreateAccountId(
  deps: AccountResolutionDeps,
): Promise<string> {
  const existingId = await deps.findAccountId();
  if (existingId) return existingId;
  return deps.createAccount();
}
