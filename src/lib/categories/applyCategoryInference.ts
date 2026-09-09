import type { NormalizedTransaction } from "@/types/transaction";
import { inferCategoryFromMerchant } from "./inferCategory";

/**
 * 既にカテゴリが分かっている取引(Wiseの既存カテゴリなど)は上書きせずそのまま残し、
 * カテゴリが未設定の取引(三井住友/エポス/楽天など)だけ店名からルールベースで補う。
 */
export function applyCategoryInference(
  transactions: NormalizedTransaction[],
): NormalizedTransaction[] {
  return transactions.map((t) =>
    t.category
      ? t
      : { ...t, category: inferCategoryFromMerchant(t.merchant) ?? undefined },
  );
}
