"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { TransactionListRow } from "@/lib/transactions/supabaseTransactionsList";
import { updateTransaction } from "@/lib/transactions/supabaseTransactionsList";
import { transactionEditSchema } from "@/lib/transactions/transactionEditSchema";
import type { Category, TransactionType } from "@/types/transaction";

const UNCATEGORIZED = "__uncategorized__";
const TYPE_LABEL: Record<TransactionType, string> = {
  expense: "支出",
  income: "収入",
};

interface EditTransactionDialogProps {
  transaction: TransactionListRow | null;
  categories: Category[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditTransactionDialog({
  transaction,
  categories,
  onOpenChange,
  onSaved,
}: EditTransactionDialogProps) {
  return (
    <Dialog open={transaction != null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>取引を編集</DialogTitle>
        </DialogHeader>
        {transaction && (
          // transaction(編集対象)が切り替わるたびにフォームの内部状態を
          // 素直に作り直したいので、useEffectで同期するのではなくkeyで
          // 再マウントさせる(Reactが推奨するstateリセットの方法)。
          <EditTransactionForm
            key={transaction.id}
            transaction={transaction}
            categories={categories}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditTransactionForm({
  transaction,
  categories,
  onOpenChange,
  onSaved,
}: {
  transaction: TransactionListRow;
  categories: Category[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(transaction.date);
  const [merchant, setMerchant] = useState(transaction.merchant ?? "");
  const [amount, setAmount] = useState(String(transaction.amount_original));
  const [currency, setCurrency] = useState(transaction.currency_original);
  const [transactionType, setTransactionType] = useState<TransactionType>(
    transaction.transaction_type,
  );
  const [categoryId, setCategoryId] = useState(
    transaction.category_id ?? UNCATEGORIZED,
  );
  const [country, setCountry] = useState(transaction.country ?? "");
  const [memo, setMemo] = useState(transaction.memo ?? "");
  const [saving, setSaving] = useState(false);

  const filteredCategories = categories.filter(
    (c) => c.kind === transactionType || c.kind === "both",
  );

  function handleTransactionTypeChange(next: TransactionType) {
    setTransactionType(next);
    // 種別を切り替えたら、旧種別のカテゴリが選ばれたままにならないようリセットする
    setCategoryId(UNCATEGORIZED);
  }

  async function handleSave() {
    const parsed = transactionEditSchema.safeParse({
      date,
      merchant,
      amountOriginal: amount,
      currencyOriginal: currency,
      categoryId: categoryId === UNCATEGORIZED ? null : categoryId,
      transactionType,
      country,
      memo,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "入力内容を確認してください");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      await updateTransaction(supabase, transaction.id, parsed.data);
      toast.success("更新しました");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="edit-date">日付</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-currency">通貨</Label>
            <Input
              id="edit-currency"
              value={currency}
              maxLength={3}
              className="uppercase"
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="edit-type">種別</Label>
          <Select
            value={transactionType}
            onValueChange={(v) => v && handleTransactionTypeChange(v as TransactionType)}
          >
            <SelectTrigger id="edit-type" className="w-full">
              <SelectValue>{TYPE_LABEL[transactionType]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">支出</SelectItem>
              <SelectItem value="income">収入</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="edit-merchant">店名</Label>
          <Input
            id="edit-merchant"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="edit-amount">金額</Label>
          <Input
            id="edit-amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="edit-category">カテゴリ</Label>
          <Select
            value={categoryId}
            onValueChange={(v) => setCategoryId(v ?? UNCATEGORIZED)}
          >
            <SelectTrigger id="edit-category" className="w-full">
              <SelectValue placeholder="未分類">
                {(v: string) =>
                  v === UNCATEGORIZED
                    ? "未分類"
                    : (categories.find((c) => c.id === v)?.name ?? "未分類")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNCATEGORIZED}>未分類</SelectItem>
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="edit-country">国</Label>
          <Input
            id="edit-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="edit-memo">メモ</Label>
          <Textarea
            id="edit-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          キャンセル
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存する"}
        </Button>
      </DialogFooter>
    </>
  );
}
