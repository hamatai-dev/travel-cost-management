import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

export type DateRangePreset = "this_week" | "this_month" | "last_month" | "all";

export interface DateRange {
  from?: string;
  to?: string;
}

const DATE_FORMAT = "yyyy-MM-dd";
// 週の開始曜日は月曜始まり(日本の生活実感・旅程の区切りに合わせる)。
const WEEK_OPTIONS = { weekStartsOn: 1 as const };

/**
 * ダッシュボードの期間プリセットを、実際の日付範囲(ISO 8601)に変換する。
 * "all" は絞り込みなし(from/toともにundefined)を意味する。
 */
export function resolveDateRangePreset(
  preset: DateRangePreset,
  today: Date = new Date(),
): DateRange {
  if (preset === "all") return {};

  if (preset === "this_week") {
    return {
      from: format(startOfWeek(today, WEEK_OPTIONS), DATE_FORMAT),
      to: format(endOfWeek(today, WEEK_OPTIONS), DATE_FORMAT),
    };
  }

  const base = preset === "this_month" ? today : subMonths(today, 1);

  return {
    from: format(startOfMonth(base), DATE_FORMAT),
    to: format(endOfMonth(base), DATE_FORMAT),
  };
}
