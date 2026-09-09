"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NumericKeypad } from "@/components/numeric-keypad";
import { SuggestionChips } from "@/components/suggestion-chips";
import { inferCategoryFromMerchant } from "@/lib/categories/inferCategory";
import { listSelectableCategories } from "@/lib/categories/supabaseCategories";
import { COMMON_CURRENCIES } from "@/lib/currency/commonCurrencies";
import {
  enqueueCashTransaction,
  listAllLocalTransactions,
  localDb,
} from "@/lib/db/localDb";
import { appendKeypadDigit } from "@/lib/input/numericKeypadInput";
import { createClient } from "@/lib/supabase/client";
import { fetchFrequentValues } from "@/lib/suggestions/supabaseFrequentValues";
import {
  buildCashTransaction,
  InvalidCashTransactionError,
} from "@/lib/transactions/cashEntry";
import { runCashTransactionSync } from "@/lib/transactions/runSync";
import type { Category, TransactionType } from "@/types/transaction";

const UNCATEGORIZED = "__uncategorized__";

interface CashEntryFormProps {
  transactionType: TransactionType;
  categories: Category[];
  frequentMerchants: string[];
  frequentCountries: string[];
  onSubmitted: (tx: ReturnType<typeof buildCashTransaction>) => Promise<void>;
}

// 支出/収入それぞれ専用の入力フォーム。タブごとに独立した状態を持たせることで、
// 「支出を入力している途中で収入タブを覗いて戻ってきても内容が消えない」を
// 保証しつつ、支出と収入で項目や候補が混ざらないようにする。
function CashEntryForm({
  transactionType,
  categories,
  frequentMerchants,
  frequentCountries,
  onSubmitted,
}: CashEntryFormProps) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("JPY");
  const [merchant, setMerchant] = useState("");
  const [country, setCountry] = useState("");
  const [categoryName, setCategoryName] = useState(UNCATEGORIZED);
  const [memo, setMemo] = useState("");

  const filteredCategories = categories.filter(
    (c) => c.kind === transactionType || c.kind === "both",
  );

  useEffect(() => {
    // 直近よく使っている国があれば、次の入力のデフォルトにする
    // (同じ国に滞在中は毎回入力しなくて済むようにするため)
    if (frequentCountries[0]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountry((prev) => prev || frequentCountries[0]);
    }
  }, [frequentCountries]);

  function applyMerchant(value: string) {
    setMerchant(value);
    // カテゴリを自分でまだ選んでいなければ、店名からルールベースで提案する
    // (あくまで提案。既存カテゴリに一致する場合だけ反映し、ユーザーは自由に変更できる)
    if (categoryName === UNCATEGORIZED) {
      const inferred = inferCategoryFromMerchant(value);
      if (inferred && filteredCategories.some((c) => c.name === inferred)) {
        setCategoryName(inferred);
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    let tx;
    try {
      tx = buildCashTransaction({
        amount: Number(amount),
        currency: currency.trim().toUpperCase() || undefined,
        merchant,
        country: country || undefined,
        categoryName: categoryName === UNCATEGORIZED ? undefined : categoryName,
        memo,
        transactionType,
      });
    } catch (err) {
      toast.error(
        err instanceof InvalidCashTransactionError
          ? err.message
          : "入力内容を確認してください",
      );
      return;
    }

    await onSubmitted(tx);
    setAmount("");
    setMerchant("");
    setCategoryName(UNCATEGORIZED);
    setMemo("");
  }

  const merchantLabel = transactionType === "income" ? "収入元(任意)" : "支払い先(任意)";
  const merchantFieldId = `merchant-${transactionType}`;
  const categoryFieldId = `categoryName-${transactionType}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor={`amount-${transactionType}`} className="mb-1.5">
            金額
          </Label>
          <Input
            id={`amount-${transactionType}`}
            type="number"
            inputMode="decimal"
            required
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="w-32">
          <Label htmlFor={`currency-${transactionType}`} className="mb-1.5">
            通貨
          </Label>
          <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
            <SelectTrigger id={`currency-${transactionType}`} className="w-full">
              <SelectValue placeholder="通貨">{(v: string) => v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {COMMON_CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code}({c.label})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* テンキー風の金額入力。素早くタップで金額を組み立てられ、OSキーボードでの直接入力も引き続き使える */}
      <NumericKeypad onKey={(key) => setAmount((prev) => appendKeypadDigit(prev, key))} />

      <div>
        <Label htmlFor={`country-${transactionType}`} className="mb-1.5">
          国(任意)
        </Label>
        <Input
          id={`country-${transactionType}`}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
        <SuggestionChips
          values={frequentCountries.filter((c) => c !== country)}
          onSelect={setCountry}
        />
      </div>

      <div>
        <Label htmlFor={merchantFieldId} className="mb-1.5">
          {merchantLabel}
        </Label>
        <Input
          id={merchantFieldId}
          value={merchant}
          onChange={(e) => applyMerchant(e.target.value)}
        />
        <SuggestionChips
          values={frequentMerchants.filter((m) => m !== merchant)}
          onSelect={applyMerchant}
        />
      </div>

      <div>
        <Label htmlFor={categoryFieldId} className="mb-1.5">
          カテゴリ
        </Label>
        <Select value={categoryName} onValueChange={(v) => setCategoryName(v ?? UNCATEGORIZED)}>
          <SelectTrigger id={categoryFieldId} className="w-full">
            <SelectValue placeholder="未分類">
              {(v: string) => (v === UNCATEGORIZED ? "未分類" : v)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNCATEGORIZED}>未分類</SelectItem>
            {filteredCategories.map((c) => (
              <SelectItem key={c.id} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor={`memo-${transactionType}`} className="mb-1.5">
          メモ(任意)
        </Label>
        <Input
          id={`memo-${transactionType}`}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full">
        記録する
      </Button>
    </form>
  );
}

export default function CashEntryPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [frequentMerchants, setFrequentMerchants] = useState<string[]>([]);
  const [frequentCountries, setFrequentCountries] = useState<string[]>([]);

  const localTransactions = useLiveQuery(
    () => listAllLocalTransactions(localDb),
    [],
  );

  async function sync(currentUserId: string) {
    setSyncing(true);
    try {
      const supabase = createClient();
      const result = await runCashTransactionSync(
        supabase,
        localDb,
        currentUserId,
      );
      if (result.syncedCount > 0) {
        toast.success(`${result.syncedCount}件同期しました`);
      }
    } catch {
      // オフライン・API未疎通時は静かに諦める(次回オンライン時に再試行される)
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id ?? null;
      if (cancelled) return;
      setUserId(id);
      if (id) {
        listSelectableCategories(supabase, id)
          .then((cats) => !cancelled && setCategories(cats))
          .catch(() => !cancelled && setCategories([]));

        Promise.all([
          fetchFrequentValues(supabase, id, "merchant"),
          fetchFrequentValues(supabase, id, "country"),
        ])
          .then(([merchants, countries]) => {
            if (cancelled) return;
            setFrequentMerchants(merchants);
            setFrequentCountries(countries);
          })
          .catch(() => {
            // 候補が取れなくても入力自体はできるので握りつぶす
          });

        if (navigator.onLine) sync(id);
      }
    });

    return () => {
      cancelled = true;
    };

  }, []);

  useEffect(() => {
    function handleOnline() {
      if (userId) sync(userId);
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);

  }, [userId]);

  async function handleSubmitted(tx: ReturnType<typeof buildCashTransaction>) {
    await enqueueCashTransaction(localDb, tx);
    toast.success("保存しました(オフラインでも記録済み)");
    if (userId && navigator.onLine) sync(userId);
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>支出・収入を記録</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="expense">
            <TabsList className="w-full">
              <TabsTrigger value="expense">支出</TabsTrigger>
              <TabsTrigger value="income">収入</TabsTrigger>
            </TabsList>
            <TabsContent value="expense" className="pt-4">
              <CashEntryForm
                transactionType="expense"
                categories={categories}
                frequentMerchants={frequentMerchants}
                frequentCountries={frequentCountries}
                onSubmitted={handleSubmitted}
              />
            </TabsContent>
            <TabsContent value="income" className="pt-4">
              <CashEntryForm
                transactionType="income"
                categories={categories}
                frequentMerchants={frequentMerchants}
                frequentCountries={frequentCountries}
                onSubmitted={handleSubmitted}
              />
            </TabsContent>
          </Tabs>
          {syncing && <p className="mt-2 text-sm text-muted-foreground">同期中...</p>}
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">最近の入力</h2>
        <ul className="divide-y">
          {localTransactions?.map((t) => (
            <li key={t.clientUuid} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p>{t.merchant}</p>
                <p className="text-muted-foreground">
                  {t.date} ・ {t.categoryName ?? "未分類"}
                </p>
              </div>
              <div className="text-right">
                <p className={t.transactionType === "income" ? "text-green-600" : undefined}>
                  {t.transactionType === "income" ? "+" : "-"}
                  {t.amountOriginal.toLocaleString()} {t.currencyOriginal}
                </p>
                <Badge variant={t.syncedAt ? "secondary" : "outline"} className="mt-1">
                  {t.syncedAt ? "同期済み" : "未同期"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
