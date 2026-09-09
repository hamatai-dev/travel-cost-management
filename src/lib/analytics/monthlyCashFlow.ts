import type { TransactionType } from "@/types/transaction";

export interface CashFlowTx {
  amountJpy: number | null;
  transactionType: TransactionType;
  date: string; // ISO 8601 (YYYY-MM-DD)
}

export interface MonthlyCashFlow {
  month: string; // YYYY-MM
  incomeJpy: number;
  expenseJpy: number;
  netJpy: number;
}

/**
 * 月ごとの収入・支出・収支(ネット)の推移を計算する。
 * 家計簿としての「今月は黒字か赤字か」を月単位の時系列で見られるようにする。
 * amountJpy が未確定(為替レート未取得)の取引は対象外にする。
 * 表示は時系列の推移なので、totalByMonth(集計ランキング用)とは逆に
 * 古い月から新しい月の昇順で返す。
 */
export function computeMonthlyCashFlow(
  transactions: CashFlowTx[],
): MonthlyCashFlow[] {
  const groups = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    if (t.amountJpy == null) continue;
    const month = t.date.slice(0, 7);
    const g = groups.get(month) ?? { income: 0, expense: 0 };
    if (t.transactionType === "income") {
      g.income += t.amountJpy;
    } else {
      g.expense += t.amountJpy;
    }
    groups.set(month, g);
  }

  return Array.from(groups, ([month, g]) => ({
    month,
    incomeJpy: g.income,
    expenseJpy: g.expense,
    netJpy: g.income - g.expense,
  })).sort((a, b) => a.month.localeCompare(b.month));
}
