"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { isDuplicateCategoryName } from "@/lib/categories/isDuplicateCategoryName";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  setCategoryFixedCost,
} from "@/lib/categories/supabaseCategoryManagement";
import { listSelectableCategories } from "@/lib/categories/supabaseCategories";
import { createClient } from "@/lib/supabase/client";
import { createNameSchema } from "@/lib/validation/nameSchema";
import type { Category, CategoryKind } from "@/types/transaction";

const categoryNameSchema = createNameSchema("カテゴリ名");
const KIND_LABEL: Record<CategoryKind, string> = {
  expense: "支出",
  income: "収入",
  both: "支出・収入共通",
};

export default function CategorySettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<CategoryKind>("expense");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function load(uid: string) {
    const supabase = createClient();
    const cats = await listSelectableCategories(supabase, uid);
    setCategories(cats);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid || cancelled) return;
      setUserId(uid);
      load(uid);
    });
    return () => {
      cancelled = true;
    };
     
  }, []);

  async function handleAdd() {
    if (!userId) {
      toast.error("読み込み中です。少し待ってからもう一度お試しください");
      return;
    }

    const parsed = categoryNameSchema.safeParse(newName);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message);
      return;
    }
    if (isDuplicateCategoryName(parsed.data, categories.map((c) => c.name))) {
      toast.error("同じ名前のカテゴリが既にあります");
      return;
    }

    try {
      const supabase = createClient();
      await createCategory(supabase, userId, parsed.data, newKind);
      setNewName("");
      setNewKind("expense");
      toast.success("追加しました");
      load(userId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "追加に失敗しました");
    }
  }

  async function handleRename(id: string) {
    const parsed = categoryNameSchema.safeParse(editingName);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message);
      return;
    }
    const others = categories.filter((c) => c.id !== id).map((c) => c.name);
    if (isDuplicateCategoryName(parsed.data, others)) {
      toast.error("同じ名前のカテゴリが既にあります");
      return;
    }

    try {
      const supabase = createClient();
      await renameCategory(supabase, id, parsed.data);
      setEditingId(null);
      toast.success("更新しました");
      if (userId) load(userId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    }
  }

  async function handleToggleFixedCost(id: string, checked: boolean) {
    try {
      const supabase = createClient();
      await setCategoryFixedCost(supabase, id, checked);
      if (userId) load(userId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("このカテゴリを削除します。このカテゴリが付いた取引は「未分類」になります。よろしいですか?")) {
      return;
    }
    try {
      const supabase = createClient();
      await deleteCategory(supabase, id);
      toast.success("削除しました");
      if (userId) load(userId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">カテゴリ管理</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">新しいカテゴリを追加</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="例: お土産"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Select
            value={newKind}
            onValueChange={(v) => v && setNewKind(v as CategoryKind)}
          >
            <SelectTrigger className="w-28">
              <SelectValue>{KIND_LABEL[newKind]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">支出</SelectItem>
              <SelectItem value="income">収入</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={loading}>
            追加
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <ul className="divide-y rounded-md border">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 p-3">
              {editingId === c.id ? (
                <div className="flex flex-1 gap-2">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename(c.id)}
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleRename(c.id)}>
                    保存
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    キャンセル
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex items-center gap-2">
                    {c.name}
                    {c.kind === "income" && <Badge variant="secondary">収入</Badge>}
                    {c.is_default && <Badge variant="outline">デフォルト</Badge>}
                  </span>
                  {!c.is_default && (
                    <div className="flex items-center gap-3">
                      {c.kind !== "income" && (
                        <Label
                          htmlFor={`fixed-cost-${c.id}`}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <Checkbox
                            id={`fixed-cost-${c.id}`}
                            checked={c.is_fixed_cost}
                            onCheckedChange={(checked) =>
                              handleToggleFixedCost(c.id, checked === true)
                            }
                          />
                          固定費
                        </Label>
                      )}
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditingName(c.name);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        「固定費」は自分で追加したカテゴリにのみ設定できます(共有のデフォルトカテゴリには影響させないため)。AWS・Netflixなどの毎月の支払いは、専用のカテゴリを作って固定費にチェックすると、ダッシュボードで旅の変動費と分けて見られます。
      </p>
    </main>
  );
}
