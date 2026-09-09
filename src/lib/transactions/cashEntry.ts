import type {
  LocalTransaction,
  LocalTransactionInput,
} from "@/types/localTransaction";

export class InvalidCashTransactionError extends Error {}

/**
 * 現金入力フォームの値を、ローカル保存用の正規化済みレコードに変換する。
 * オフラインでも完結する純粋関数(DB・ネットワークに依存しない)。
 */
export function buildCashTransaction(
  input: LocalTransactionInput,
  now: Date = new Date(),
): LocalTransaction {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new InvalidCashTransactionError("金額は正の数で入力してください");
  }

  const clientUuid = crypto.randomUUID();
  const transactionType = input.transactionType ?? "expense";
  const merchant =
    input.merchant?.trim() || (transactionType === "income" ? "収入" : "現金支払い");

  return {
    clientUuid,
    date: input.date ?? now.toISOString().slice(0, 10),
    merchant,
    memo: input.memo?.trim() || undefined,
    amountOriginal: input.amount,
    currencyOriginal: input.currency ?? "JPY",
    categoryName: input.categoryName,
    country: input.country?.trim() || undefined,
    city: input.city?.trim() || undefined,
    source: "cash",
    transactionType,
    dedupeHash: clientUuid,
    createdAt: now.toISOString(),
  };
}
