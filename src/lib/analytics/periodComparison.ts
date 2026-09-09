import { format, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";

export interface ComparablePeriodTx {
  amountJpy: number | null;
  date: string; // ISO 8601 (YYYY-MM-DD)
}

export interface PeriodComparison {
  currentJpy: number;
  previousJpy: number;
  /** (current - previous) / previous。previousJpyが0の場合は比較不能としてnull */
  changeRate: number | null;
}

export interface PeriodComparisons {
  monthOverMonth: PeriodComparison;
  weekOverWeek: PeriodComparison;
}

const DATE_FORMAT = "yyyy-MM-dd";
const WEEK_OPTIONS = { weekStartsOn: 1 as const };

function sumInRange(transactions: ComparablePeriodTx[], from: string, to: string): number {
  return transactions
    .filter((t) => t.amountJpy != null && t.date >= from && t.date <= to)
    .reduce((sum, t) => sum + (t.amountJpy ?? 0), 0);
}

function buildComparison(currentJpy: number, previousJpy: number): PeriodComparison {
  return {
    currentJpy,
    previousJpy,
    changeRate: previousJpy > 0 ? (currentJpy - previousJpy) / previousJpy : null,
  };
}

/**
 * 「今月はここまでいくら使ったか」を、先月の同じ日数分・先週の同じ日数分と比べる。
 * どちらも「今日と同じ経過日数」同士で揃えることで、月末近くの先月(30日分)と
 * 今月序盤(数日分)のような不公平な比較にならないようにする。
 * amountJpy が未確定(為替レート未取得)の取引は対象外にする。
 */
export function computePeriodComparisons(
  transactions: ComparablePeriodTx[],
  today: Date = new Date(),
): PeriodComparisons {
  const todayStr = format(today, DATE_FORMAT);

  const monthCurrentFrom = format(startOfMonth(today), DATE_FORMAT);
  const lastMonthToday = subMonths(today, 1);
  const monthPreviousFrom = format(startOfMonth(lastMonthToday), DATE_FORMAT);
  const monthPreviousTo = format(lastMonthToday, DATE_FORMAT);

  const weekCurrentFrom = format(startOfWeek(today, WEEK_OPTIONS), DATE_FORMAT);
  const lastWeekToday = subWeeks(today, 1);
  const weekPreviousFrom = format(startOfWeek(lastWeekToday, WEEK_OPTIONS), DATE_FORMAT);
  const weekPreviousTo = format(lastWeekToday, DATE_FORMAT);

  return {
    monthOverMonth: buildComparison(
      sumInRange(transactions, monthCurrentFrom, todayStr),
      sumInRange(transactions, monthPreviousFrom, monthPreviousTo),
    ),
    weekOverWeek: buildComparison(
      sumInRange(transactions, weekCurrentFrom, todayStr),
      sumInRange(transactions, weekPreviousFrom, weekPreviousTo),
    ),
  };
}
