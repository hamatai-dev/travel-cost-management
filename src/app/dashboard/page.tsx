"use client";

import { useEffect, useState } from "react";
import { PieChart } from "@/components/pie-chart";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { AggregationResult, Total } from "@/lib/analytics/aggregate";
import type { CountryDailyAverage } from "@/lib/analytics/countryDailyAverage";
import type { DateRange } from "@/lib/analytics/dateRange";
import type { MonthlyCashFlow } from "@/lib/analytics/monthlyCashFlow";
import type { PeriodComparisons } from "@/lib/analytics/periodComparison";
import {
  runDashboardAnalytics,
  type DashboardData,
} from "@/lib/analytics/runDashboardAnalytics";
import { runPeriodComparisons } from "@/lib/analytics/runPeriodComparisons";
import { runCurrencyTrend, type CurrencyTrendResult } from "@/lib/fx/runCurrencyTrend";
import { createClient } from "@/lib/supabase/client";
import { resolveMonthRange } from "@/lib/transactions/resolveMonthRange";
import { cn } from "@/lib/utils";

const ALL = "__all__";
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => String(CURRENT_YEAR + 1 - i));
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

function resolveSelectedDateRange(year: string, month: string): DateRange {
  if (year === ALL || month === ALL) return {};
  return resolveMonthRange(`${year}-${month}`);
}

function formatChangeRate(rate: number | null): string {
  if (rate == null) return "比較データなし";
  const percent = Math.round(rate * 100);
  return `${percent >= 0 ? "+" : ""}${percent}%`;
}

function changeRateColorClass(rate: number | null): string | undefined {
  if (rate == null) return undefined;
  if (rate > 0) return "text-red-600";
  if (rate < 0) return "text-green-600";
  return undefined;
}

type State =
  | { step: "loading" }
  | { step: "ready"; data: DashboardData }
  | { step: "error"; message: string };

function BarList({ result }: { result: AggregationResult }) {
  const max = Math.max(1, ...result.totals.map((t) => t.totalJpy));

  if (result.totals.length === 0) {
    return <p className="text-sm text-muted-foreground">データがありません</p>;
  }

  return (
    <ul className="space-y-3">
      {result.totals.map((t: Total) => (
        <li key={t.label} className="text-sm">
          <div className="flex justify-between">
            <span>{t.label}</span>
            <span className="text-muted-foreground">¥{t.totalJpy.toLocaleString()}</span>
          </div>
          <div className="mt-1 h-2 rounded bg-muted">
            <div
              className="h-2 rounded bg-primary"
              style={{ width: `${(t.totalJpy / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
      {result.excludedCount > 0 && (
        <li className="text-xs text-muted-foreground">
          ※ {result.excludedCount}件は為替レート未取得のため集計に含まれていません
        </li>
      )}
    </ul>
  );
}

function CountryDailyAverageList({ items }: { items: CountryDailyAverage[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="mb-2 text-xs font-medium text-muted-foreground">国ごとの1日あたり支出</h3>
      <ul className="space-y-1.5">
        {items.map((c) => (
          <li key={c.country} className="flex justify-between text-sm">
            <span>
              {c.country} <span className="text-xs text-muted-foreground">({c.days}日)</span>
            </span>
            <span className="text-muted-foreground">
              ¥{c.dailyAverageJpy.toLocaleString()}/日
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MonthlyCashFlowList({ items }: { items: MonthlyCashFlow[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="mb-2 text-xs font-medium text-muted-foreground">月ごとの収支</h3>
      <ul className="space-y-2">
        {items.map((m) => (
          <li key={m.month} className="text-sm">
            <div className="flex justify-between">
              <span>{m.month}</span>
              <span className={cn(m.netJpy < 0 ? "text-red-600" : "text-green-600")}>
                {m.netJpy >= 0 ? "+" : ""}
                ¥{m.netJpy.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              収入 ¥{m.incomeJpy.toLocaleString()} ・ 支出 ¥{m.expenseJpy.toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DashboardPage() {
  const [state, setState] = useState<State>({ step: "loading" });
  const [selectedYear, setSelectedYear] = useState(ALL);
  const [selectedMonth, setSelectedMonth] = useState(ALL);
  const [userId, setUserId] = useState<string | null>(null);
  const [comparisons, setComparisons] = useState<PeriodComparisons | null>(null);
  const [currencyTrend, setCurrencyTrend] = useState<CurrencyTrendResult | null>(null);
  // 選択中の期間フィルタに関係なく、これまでの全取引から計算する「現在の総残高」。
  const [totalBalanceJpy, setTotalBalanceJpy] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id;
      if (!uid) {
        if (!cancelled) {
          setState({ step: "error", message: "ログイン情報が確認できませんでした。" });
        }
        return;
      }
      setUserId(uid);
      try {
        const dateRange = resolveSelectedDateRange(selectedYear, selectedMonth);
        const result = await runDashboardAnalytics(supabase, uid, dateRange);
        if (cancelled) return;

        setState({ step: "ready", data: result });
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "集計に失敗しました。";
          setState({ step: "error", message });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    // 先月比・先週比・為替トレンド・現在の総残高は選択中の期間フィルタとは独立
    // (常に直近/全期間を見る)なので、userId が確定した時点で一度だけ取得する。
    if (!userId) return;
    let cancelled = false;
    const supabase = createClient();

    runPeriodComparisons(supabase, userId)
      .then((result) => !cancelled && setComparisons(result))
      .catch(() => {
        // 取れなくてもダッシュボード本体は問題なく使えるので静かに諦める
      });

    runCurrencyTrend(supabase, userId)
      .then((result) => !cancelled && setCurrencyTrend(result))
      .catch(() => {
        // 滞在国・レートが特定できない場合も同様に静かに非表示のままにする
      });

    runDashboardAnalytics(supabase, userId, {})
      .then((result) => !cancelled && setTotalBalanceJpy(result.netJpy))
      .catch(() => {
        // 取れなくても円グラフ側は選択中期間の内訳として動くので静かに諦める
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  function handleYearMonthChange(year: string, month: string) {
    setSelectedYear(year);
    setSelectedMonth(month);
  }

  const periodLabel =
    selectedYear === ALL || selectedMonth === ALL
      ? "全期間"
      : `${selectedYear}年${Number(selectedMonth)}月`;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ダッシュボード</h1>
        <div className="flex gap-2">
          <Select
            value={selectedYear}
            onValueChange={(v) => v && handleYearMonthChange(v, selectedMonth)}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="年">
                {(v: string) => (v === ALL ? "全年" : `${v}年`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全年</SelectItem>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedMonth}
            onValueChange={(v) => v && handleYearMonthChange(selectedYear, v)}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="月">
                {(v: string) => (v === ALL ? "全月" : `${Number(v)}月`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全月</SelectItem>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>
                  {Number(m)}月
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {state.step === "loading" && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {state.step === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      {state.step === "ready" && (
        <>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">現在の総残高(全期間の収支)</p>
              {totalBalanceJpy != null ? (
                <p
                  className={cn(
                    "text-3xl font-semibold",
                    totalBalanceJpy < 0 ? "text-red-600" : undefined,
                  )}
                >
                  {totalBalanceJpy >= 0 ? "" : "-"}¥{Math.abs(totalBalanceJpy).toLocaleString()}
                </p>
              ) : (
                <Skeleton className="mt-1 h-9 w-40" />
              )}

              <div className="mt-4 flex items-center gap-4">
                <PieChart
                  data={[
                    { label: "支出", value: state.data.totalJpy, colorClass: "fill-red-500" },
                    {
                      label: "収入",
                      value: state.data.totalIncomeJpy,
                      colorClass: "fill-green-500",
                    },
                  ]}
                />
                <ul className="flex-1 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full bg-red-500" />
                    <span className="flex-1">
                      支出({state.data.transactionCount}件)
                    </span>
                    <span className="font-medium">¥{state.data.totalJpy.toLocaleString()}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full bg-green-500" />
                    <span className="flex-1">収入</span>
                    <span className="font-medium">
                      ¥{state.data.totalIncomeJpy.toLocaleString()}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{periodLabel}の内訳</span>
                <span
                  className={cn(
                    "font-medium",
                    state.data.netJpy < 0 ? "text-red-600" : "text-green-600",
                  )}
                >
                  収支 {state.data.netJpy >= 0 ? "+" : ""}¥{state.data.netJpy.toLocaleString()}
                </span>
              </div>

              {state.data.fixedCostJpy > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  うち固定費 ¥{state.data.fixedCostJpy.toLocaleString()} ・ 旅の変動費 ¥
                  {(state.data.totalJpy - state.data.fixedCostJpy).toLocaleString()}
                </p>
              )}
              {state.data.excludedCount > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  ※ {state.data.excludedCount}件は為替レート未取得のため合計に含まれていません
                </p>
              )}
            </CardContent>
          </Card>

          {(comparisons || currencyTrend) && (
            <Card>
              <CardContent className="space-y-1.5 pt-6 text-sm">
                {comparisons && (
                  <p className="text-muted-foreground">
                    先月比{" "}
                    <span className={changeRateColorClass(comparisons.monthOverMonth.changeRate)}>
                      {formatChangeRate(comparisons.monthOverMonth.changeRate)}
                    </span>
                    {" ・ "}
                    先週比{" "}
                    <span className={changeRateColorClass(comparisons.weekOverWeek.changeRate)}>
                      {formatChangeRate(comparisons.weekOverWeek.changeRate)}
                    </span>
                  </p>
                )}
                {currencyTrend && (
                  <p className="text-muted-foreground">
                    現在の滞在国: {currencyTrend.country}({currencyTrend.currency}) 1
                    {currencyTrend.currency} = ¥{currencyTrend.currentRateJpy.toFixed(2)}
                    (先週比 {formatChangeRate(currencyTrend.changeRate)}・{currencyTrend.direction})
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="category">
                <TabsList className="w-full">
                  <TabsTrigger value="category">カテゴリ</TabsTrigger>
                  <TabsTrigger value="income">収入</TabsTrigger>
                  <TabsTrigger value="account">支払い種別</TabsTrigger>
                  <TabsTrigger value="country">国</TabsTrigger>
                  <TabsTrigger value="month">月別</TabsTrigger>
                </TabsList>
                <TabsContent value="category" className="pt-4">
                  <BarList result={state.data.byCategory} />
                </TabsContent>
                <TabsContent value="income" className="pt-4">
                  <BarList result={state.data.byIncomeCategory} />
                </TabsContent>
                <TabsContent value="account" className="pt-4">
                  <BarList result={state.data.byAccount} />
                </TabsContent>
                <TabsContent value="country" className="pt-4">
                  <BarList result={state.data.byCountry} />
                  <CountryDailyAverageList items={state.data.countryDailyAverages} />
                </TabsContent>
                <TabsContent value="month" className="pt-4">
                  <BarList result={state.data.byMonth} />
                  <MonthlyCashFlowList items={state.data.monthlyCashFlow} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
