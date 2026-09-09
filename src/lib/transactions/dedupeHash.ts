// CSV再インポート時の重複判定にのみ使う非暗号学的ハッシュ(FNV-1a)。
// account_id + date + amount + merchant が一致する行は同一取引とみなす。
export function computeDedupeHash(
  accountId: string,
  date: string,
  amountOriginal: number,
  merchant: string,
): string {
  const input = `${accountId}|${date}|${amountOriginal}|${merchant.trim()}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
