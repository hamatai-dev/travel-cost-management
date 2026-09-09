import { endOfMonth, format, parse, startOfMonth } from "date-fns";
import type { DateRange } from "@/lib/analytics/dateRangePresets";

const MONTH_INPUT_FORMAT = "yyyy-MM";
const DATE_FORMAT = "yyyy-MM-dd";

/**
 * <input type="month">が返す値("YYYY-MM")を、その月の1日〜末日のISO日付範囲に変換する。
 * 取引一覧ページの「月で絞り込む」フィルタに使う。未選択(空文字)の場合は
 * 絞り込みなし({})を返す。
 */
export function resolveMonthRange(month: string): DateRange {
  if (!month) return {};

  const base = parse(month, MONTH_INPUT_FORMAT, new Date());
  return {
    from: format(startOfMonth(base), DATE_FORMAT),
    to: format(endOfMonth(base), DATE_FORMAT),
  };
}
