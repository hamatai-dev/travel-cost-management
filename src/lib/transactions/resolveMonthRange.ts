import { endOfMonth, format, parse, startOfMonth } from "date-fns";
import type { DateRange } from "@/lib/analytics/dateRange";

const MONTH_INPUT_FORMAT = "yyyy-MM";
const DATE_FORMAT = "yyyy-MM-dd";

/**
 * "YYYY-MM"形式の年月を、その月の1日〜末日のISO日付範囲に変換する。
 * 取引一覧・ダッシュボードの「年・月で絞り込む」フィルタに共通で使う。
 * 未選択(空文字)の場合は絞り込みなし({})を返す。
 */
export function resolveMonthRange(month: string): DateRange {
  if (!month) return {};

  const base = parse(month, MONTH_INPUT_FORMAT, new Date());
  return {
    from: format(startOfMonth(base), DATE_FORMAT),
    to: format(endOfMonth(base), DATE_FORMAT),
  };
}
