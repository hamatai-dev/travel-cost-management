import { differenceInCalendarDays } from "date-fns";

export interface CountryDailyAverageInput {
  country?: string | null;
  date: string; // ISO 8601 (YYYY-MM-DD)
  amountJpy?: number | null;
}

export interface CountryDailyAverage {
  country: string;
  totalJpy: number;
  days: number;
  dailyAverageJpy: number;
}

/**
 * 国ごとの「1日あたり支出」を計算する。
 * 滞在日数は、その国での最初の取引日から最後の取引日までの日数(両端含む)。
 * 実際の入国日・出国日とは必ずしも一致しないが、記録された取引日から
 * おおよその目安を出す。国未設定・円換算未確定の取引は対象外にする
 * (「不明」を1つの滞在としてまとめる意味がないため)。
 */
export function computeCountryDailyAverages(
  transactions: CountryDailyAverageInput[],
): CountryDailyAverage[] {
  const groups = new Map<string, { total: number; minDate: string; maxDate: string }>();

  for (const t of transactions) {
    const country = t.country?.trim();
    if (!country || t.amountJpy == null) continue;

    const existing = groups.get(country);
    if (!existing) {
      groups.set(country, { total: t.amountJpy, minDate: t.date, maxDate: t.date });
      continue;
    }

    existing.total += t.amountJpy;
    if (t.date < existing.minDate) existing.minDate = t.date;
    if (t.date > existing.maxDate) existing.maxDate = t.date;
  }

  return Array.from(groups, ([country, g]) => {
    const days = differenceInCalendarDays(new Date(g.maxDate), new Date(g.minDate)) + 1;
    return {
      country,
      totalJpy: g.total,
      days,
      dailyAverageJpy: Math.round(g.total / days),
    };
  }).sort((a, b) => b.totalJpy - a.totalJpy);
}
