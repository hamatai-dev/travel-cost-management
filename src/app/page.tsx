"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SignOutButton } from "@/app/sign-out-button";
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSelectableCategories } from "@/lib/categories/supabaseCategories";
import { truncateText } from "@/lib/format/truncateText";
import { fetchJpyRate } from "@/lib/fx/fetchRate";
import { persistResolvedAmounts } from "@/lib/fx/persistResolvedAmounts";
import { resolveMissingAmountsJpy } from "@/lib/fx/resolveMissingAmountsJpy";
import { createClient } from "@/lib/supabase/client";
import type { TransactionFilters } from "@/lib/transactions/applyTransactionFilters";
import { resolveMonthRange } from "@/lib/transactions/resolveMonthRange";
import { fetchAccountNameMap } from "@/lib/transactions/supabaseTransactions";
import {
  deleteTransactions,
  fetchTransactionsPage,
  type TransactionListRow,
} from "@/lib/transactions/supabaseTransactionsList";
import type { Category, TransactionType } from "@/types/transaction";

const PAGE_SIZE = 20;
const ALL = "__all__";
const TYPE_LABEL: Record<TransactionType, string> = {
  expense: "支出",
  income: "収入",
};

// 過去の旅程を振り返る用途が中心のため、少し過去〜現在+1年までを選べるようにする
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = String(new Date().getMonth() + 1).padStart(2, "0");
const YEARS = Array.from({ length: 6 }, (_, i) => String(CURRENT_YEAR + 1 - i));
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

export default function TransactionsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [rows, setRows] = useState<TransactionListRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  // 初期表示は常に今月に絞り込んだ状態にする(旅の記録は直近の月を見返すことが
  // 多いため、開いてすぐ今月分が見える方が便利)
  const [filters, setFilters] = useState<TransactionFilters>(() => {
    const { from, to } = resolveMonthRange(`${CURRENT_YEAR}-${CURRENT_MONTH}`);
    return { dateFrom: from, dateTo: to };
  });
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<TransactionListRow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const accountNameById = new Map(accounts.map((a) => [a.id, a.name]));

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id;
      if (!uid || cancelled) return;
      setUserId(uid);
      const [cats, accountMap] = await Promise.all([
        listSelectableCategories(supabase, uid),
        fetchAccountNameMap(supabase, uid),
      ]);
      if (cancelled) return;
      setCategories(cats);
      setAccounts(Array.from(accountMap, ([id, name]) => ({ id, name })));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // フィルタ/ページ切り替え直後にローディング表示を出すための同期的な
    // setState。取得自体は非同期(then以降)なので実害はない。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    const supabase = createClient();
    fetchTransactionsPage(supabase, userId, filters, page, PAGE_SIZE)
      .then(async (result) => {
        if (cancelled) return;
        setRows(result.rows);
        setTotalCount(result.totalCount);
        setSelectedIds(new Set());

        // 円換算が未確定の行(外貨建てのWise・現金入力など)は、表示をブロックせず
        // バックグラウンドで解決する。失敗しても一覧表示自体には影響させない。
        try {
          const resolved = await resolveMissingAmountsJpy(
            result.rows.map((r) => ({
              id: r.id,
              amountJpy: r.amount_jpy,
              amountOriginal: r.amount_original,
              currencyOriginal: r.currency_original,
              date: r.date,
            })),
            fetchJpyRate,
          );
          if (cancelled || resolved.length === 0) return;

          await persistResolvedAmounts(supabase, resolved);
          if (cancelled) return;

          const resolvedMap = new Map(resolved.map((r) => [r.id, r.amountJpy]));
          setRows((prev) =>
            prev.map((r) =>
              resolvedMap.has(r.id) ? { ...r, amount_jpy: resolvedMap.get(r.id)! } : r,
            ),
          );
        } catch {
          // 為替レートが取れなくても一覧は普通に使えるので無視する
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "取得に失敗しました");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, filters, page, refreshKey]);

  function updateFilter(patch: Partial<TransactionFilters>) {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function handleYearMonthChange(year: string, month: string) {
    setSelectedYear(year);
    setSelectedMonth(month);

    if (year === ALL || month === ALL) {
      updateFilter({ dateFrom: undefined, dateTo: undefined });
      return;
    }
    const { from, to } = resolveMonthRange(`${year}-${month}`);
    updateFilter({ dateFrom: from, dateTo: to });
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}件の取引を削除します。よろしいですか?`)) return;

    try {
      const supabase = createClient();
      await deleteTransactions(supabase, Array.from(selectedIds));
      toast.success(`${selectedIds.size}件削除しました`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">取引一覧</h1>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              {selectedIds.size}件削除
            </Button>
          )}
          <SignOutButton />
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Select
            value={filters.transactionType ?? ALL}
            onValueChange={(v) =>
              updateFilter({
                transactionType: !v || v === ALL ? undefined : (v as TransactionType),
              })
            }
          >
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="種別">
                {(v: string) => (v === ALL ? "すべての種別" : TYPE_LABEL[v as TransactionType])}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>すべての種別</SelectItem>
              <SelectItem value="expense">支出</SelectItem>
              <SelectItem value="income">収入</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.accountId ?? ALL}
            onValueChange={(v) => updateFilter({ accountId: !v || v === ALL ? undefined : v })}
          >
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="支払い種別">
                {(v: string) =>
                  v === ALL ? "すべての支払い種別" : (accountNameById.get(v) ?? "支払い種別")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>すべての支払い種別</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.categoryId ?? ALL}
            onValueChange={(v) => updateFilter({ categoryId: !v || v === ALL ? undefined : v })}
          >
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="カテゴリ">
                {(v: string) =>
                  v === ALL ? "すべてのカテゴリ" : (categoryNameById.get(v) ?? "カテゴリ")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>すべてのカテゴリ</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Select
            value={selectedYear}
            onValueChange={(v) => v && handleYearMonthChange(v, selectedMonth)}
          >
            <SelectTrigger className="flex-1 min-w-0">
              <SelectValue placeholder="年">
                {(v: string) => (v === ALL ? "すべての年" : `${v}年`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>すべての年</SelectItem>
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
            <SelectTrigger className="flex-1 min-w-0">
              <SelectValue placeholder="月">
                {(v: string) => (v === ALL ? "すべての月" : `${Number(v)}月`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>すべての月</SelectItem>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>
                  {Number(m)}月
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(selectedYear !== ALL || selectedMonth !== ALL) && (
            <Button type="button" variant="outline" onClick={() => handleYearMonthChange(ALL, ALL)}>
              すべての期間
            </Button>
          )}
        </div>
      </div>

      <Input
        placeholder="店名・メモで検索"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") updateFilter({ search: searchInput || undefined });
        }}
        onBlur={() => updateFilter({ search: searchInput || undefined })}
      />

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>日付</TableHead>
              <TableHead>種別</TableHead>
              <TableHead>店名</TableHead>
              <TableHead>カテゴリ</TableHead>
              <TableHead>支払い種別</TableHead>
              <TableHead>国</TableHead>
              <TableHead>メモ</TableHead>
              <TableHead className="text-right">金額</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  取引がありません
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => setEditing(row)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(row.id)}
                      onCheckedChange={(checked) => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(row.id);
                          else next.delete(row.id);
                          return next;
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>
                    <Badge variant={row.transaction_type === "income" ? "default" : "outline"}>
                      {TYPE_LABEL[row.transaction_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate">
                    {row.merchant || "-"}
                  </TableCell>
                  <TableCell>
                    {row.category_id ? (
                      <Badge variant="secondary">
                        {categoryNameById.get(row.category_id) ?? "-"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">未分類</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {accountNameById.get(row.account_id) ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.country || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.memo ? truncateText(row.memo, 12) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={row.transaction_type === "income" ? "text-green-600" : undefined}>
                      {row.transaction_type === "income" ? "+" : "-"}
                      {row.amount_original.toLocaleString()} {row.currency_original}
                    </div>
                    {row.amount_jpy != null && row.currency_original !== "JPY" && (
                      <div className="text-xs text-muted-foreground">
                        ¥{row.amount_jpy.toLocaleString()}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {totalCount}件中 {rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}〜
          {(page - 1) * PAGE_SIZE + rows.length}件
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            前へ
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            次へ
          </Button>
        </div>
      </div>

      <EditTransactionDialog
        transaction={editing}
        categories={categories}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={refresh}
      />
    </main>
  );
}
