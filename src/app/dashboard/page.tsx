"use client";

import { useEffect, useState } from "react";
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
import {
  resolveDateRangePreset,
  type DateRangePreset,
} from "@/lib/analytics/dateRangePresets";
import type { MonthlyCashFlow } from "@/lib/analytics/monthlyCashFlow";
import type { PeriodComparisons } from "@/lib/analytics/periodComparison";
import {
  runDashboardAnalytics,
  type DashboardData,
} from "@/lib/analytics/runDashboardAnalytics";
import { runPeriodComparisons } from "@/lib/analytics/runPeriodComparisons";
import { runCurrencyTrend, type CurrencyTrendResult } from "@/lib/fx/runCurrencyTrend";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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

const PERIOD_LABEL: Record<DateRangePreset, string> = {
  this_week: "今週",
  this_month: "今月",
  last_month: "先月",
  all: "全期間",
};

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
  const [period, setPeriod] = useState<DateRangePreset>("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [comparisons, setComparisons] = useState<PeriodComparisons | null>(null);
  const [currencyTrend, setCurrencyTrend] = useState<CurrencyTrendResult | null>(null);

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
        const dateRange = resolveDateRangePreset(period);
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
  }, [period]);

  useEffect(() => {
    // 先月比・先週比・為替トレンドは選択中の期間フィルタとは独立な「一言サマリー」
    // なので、userId が確定した時点で一度だけ取得する(period切り替えでは再取得しない)。
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

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ダッシュボード</h1>
        <Select value={period} onValueChange={(v) => v && setPeriod(v as DateRangePreset)}>
          <SelectTrigger className="w-28">
            <SelectValue>{PERIOD_LABEL[period]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_week">今週</SelectItem>
            <SelectItem value="this_month">今月</SelectItem>
            <SelectItem value="last_month">先月</SelectItem>
            <SelectItem value="all">全期間</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {state.step === "loading" && (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {state.step === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      {state.step === "ready" && (
        <>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                合計支出({state.data.transactionCount}件)
              </p>
              <p className="text-3xl font-semibold">
                ¥{state.data.totalJpy.toLocaleString()}
              </p>
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
              <div className="mt-4 flex justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">
                  収入 ¥{state.data.totalIncomeJpy.toLocaleString()}
                </span>
                <span
                  className={cn(
                    "font-medium",
                    state.data.netJpy < 0 ? "text-red-600" : "text-green-600",
                  )}
                >
                  収支 {state.data.netJpy >= 0 ? "+" : ""}¥{state.data.netJpy.toLocaleString()}
                </span>
              </div>
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
