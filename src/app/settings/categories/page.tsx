"use client";

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORY_COLOR_PALETTE } from "@/lib/categories/categoryColorPalette";
import { isDuplicateCategoryName } from "@/lib/categories/isDuplicateCategoryName";
import {
  fetchHiddenCategories,
  listSelectableCategories,
} from "@/lib/categories/supabaseCategories";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  setCategoryFixedCost,
} from "@/lib/categories/supabaseCategoryManagement";
import {
  hideCategoryForUser,
  saveCategoryColorForUser,
  saveCategorySortOrder,
  unhideCategoryForUser,
} from "@/lib/categories/supabaseCategoryPreferences";
import { createClient } from "@/lib/supabase/client";
import { createNameSchema } from "@/lib/validation/nameSchema";
import type { Category, TransactionType } from "@/types/transaction";

const categoryNameSchema = createNameSchema("カテゴリ名");
const ADD_PLACEHOLDER: Record<TransactionType, string> = {
  expense: "例: お土産",
  income: "例: フリーランス収入",
};
const UNSET_COLOR = "__unset__";

function SortableCategoryRow({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between gap-2 bg-background p-3"
    >
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="ドラッグして並び替え"
          className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        {children}
      </div>
    </li>
  );
}

interface CategoryKindPanelProps {
  kind: TransactionType;
  categories: Category[];
  hiddenCategories: Category[];
  userId: string | null;
  onChanged: () => void;
}

// 支出/収入それぞれ専用のカテゴリ管理パネル。タブで切り替える別画面として扱い、
// 追加フォームには種別セレクトを持たせず(タブ自体が種別を表すため)、
// 表示するカテゴリもそのタブの種別(+ 支出・収入共通の'both')だけに絞る。
// userIdは親から受け取る(タブ切り替えでこのコンポーネント自体が作り直されるため、
// ここで毎回取得し直すと切り替え直後の追加操作が「読み込み中」で弾かれてしまう)。
function CategoryKindPanel({
  kind,
  categories,
  hiddenCategories,
  userId,
  onChanged,
}: CategoryKindPanelProps) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  // ドラッグ中は親からの再フェッチを待たず即座に見た目を反映する
  const [orderedIds, setOrderedIds] = useState<string[]>(categories.map((c) => c.id));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrderedIds(categories.map((c) => c.id));
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const orderedCategories = orderedIds
    .map((id) => categoryById.get(id))
    .filter((c): c is Category => c != null);

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

    setAdding(true);
    try {
      const supabase = createClient();
      await createCategory(supabase, userId, parsed.data, kind);
      setNewName("");
      toast.success("追加しました");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setAdding(false);
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
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    }
  }

  async function handleToggleFixedCost(id: string, checked: boolean) {
    try {
      const supabase = createClient();
      await setCategoryFixedCost(supabase, id, checked);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    }
  }

  async function handleColorChange(id: string, color: string | null) {
    if (!userId) return;
    try {
      const supabase = createClient();
      await saveCategoryColorForUser(supabase, userId, id, color);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "色の更新に失敗しました");
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || !userId) return;
    try {
      const supabase = createClient();
      if (deleteTarget.is_default) {
        // 共有のデフォルトカテゴリは直接削除できないため、自分の一覧からだけ隠す。
        // 既存の取引の分類には影響しない。
        await hideCategoryForUser(supabase, userId, deleteTarget.id);
        toast.success("一覧から非表示にしました");
      } else {
        await deleteCategory(supabase, deleteTarget.id);
        toast.success("削除しました");
      }
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    }
  }

  async function handleRestore(id: string) {
    if (!userId) return;
    try {
      const supabase = createClient();
      await unhideCategoryForUser(supabase, userId, id);
      toast.success("再表示しました");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "再表示に失敗しました");
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !userId) return;

    const oldIndex = orderedIds.indexOf(String(active.id));
    const newIndex = orderedIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(next);

    const supabase = createClient();
    saveCategorySortOrder(supabase, userId, next).catch((err) => {
      toast.error(err instanceof Error ? err.message : "並び順の保存に失敗しました");
      onChanged();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">新しいカテゴリを追加</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={ADD_PLACEHOLDER[kind]}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={adding}>
            追加
          </Button>
        </CardContent>
      </Card>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          <ul className="divide-y rounded-md border">
            {orderedCategories.length === 0 && (
              <li className="p-3 text-sm text-muted-foreground">カテゴリがありません</li>
            )}
            {orderedCategories.map((c) => (
              <SortableCategoryRow key={c.id} id={c.id}>
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
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <span className="truncate">{c.name}</span>
                    <div className="flex items-center gap-3">
                      <Select
                        value={c.color ?? UNSET_COLOR}
                        onValueChange={(v) =>
                          handleColorChange(c.id, v === UNSET_COLOR ? null : v)
                        }
                      >
                        <SelectTrigger size="sm" aria-label={`${c.name}の色を選択`}>
                          <SelectValue placeholder="色">
                            {(v: string) => {
                              const option = CATEGORY_COLOR_PALETTE.find(
                                (o) => o.value === v,
                              );
                              return (
                                <>
                                  <span
                                    className="size-3 rounded-full border border-black/10"
                                    style={{ backgroundColor: option?.value ?? "transparent" }}
                                  />
                                  {option?.name ?? "未設定"}
                                </>
                              );
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNSET_COLOR}>未設定</SelectItem>
                          {CATEGORY_COLOR_PALETTE.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span
                                className="size-3 rounded-full border border-black/10"
                                style={{ backgroundColor: option.value }}
                              />
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!c.is_default && c.kind !== "income" && (
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
                        {!c.is_default && (
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
                        )}
                        <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(c)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </SortableCategoryRow>
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {hiddenCategories.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-medium text-muted-foreground">非表示にしたカテゴリ</h2>
          <ul className="divide-y rounded-md border">
            {hiddenCategories.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <span className="text-muted-foreground">{c.name}</span>
                <Button size="sm" variant="outline" onClick={() => handleRestore(c.id)}>
                  表示に戻す
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.is_default ? "カテゴリを一覧から隠しますか?" : "カテゴリを削除しますか?"}
        description={
          deleteTarget?.is_default
            ? `「${deleteTarget?.name ?? ""}」は他のユーザーとも共有しているデフォルトカテゴリのため削除はできませんが、自分の一覧からは非表示にできます。既存の取引の分類には影響しません。あとで「表示に戻す」からいつでも戻せます。`
            : `「${deleteTarget?.name ?? ""}」を削除します。このカテゴリが付いている取引は「未分類」になります。この操作は取り消せません。`
        }
        confirmLabel={deleteTarget?.is_default ? "非表示にする" : "削除する"}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default function CategorySettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hiddenCategories, setHiddenCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(uid: string) {
    const supabase = createClient();
    const [cats, hidden] = await Promise.all([
      listSelectableCategories(supabase, uid),
      fetchHiddenCategories(supabase, uid),
    ]);
    setCategories(cats);
    setHiddenCategories(hidden);
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

  function refresh() {
    if (userId) load(userId);
  }

  const expenseCategories = categories.filter((c) => c.kind === "expense" || c.kind === "both");
  const incomeCategories = categories.filter((c) => c.kind === "income" || c.kind === "both");
  const hiddenExpenseCategories = hiddenCategories.filter(
    (c) => c.kind === "expense" || c.kind === "both",
  );
  const hiddenIncomeCategories = hiddenCategories.filter(
    (c) => c.kind === "income" || c.kind === "both",
  );

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">カテゴリ管理</h1>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Tabs defaultValue="expense">
          <TabsList className="w-full">
            <TabsTrigger value="expense">支出</TabsTrigger>
            <TabsTrigger value="income">収入</TabsTrigger>
          </TabsList>
          <TabsContent value="expense" className="pt-4">
            <CategoryKindPanel
              kind="expense"
              categories={expenseCategories}
              hiddenCategories={hiddenExpenseCategories}
              userId={userId}
              onChanged={refresh}
            />
          </TabsContent>
          <TabsContent value="income" className="pt-4">
            <CategoryKindPanel
              kind="income"
              categories={incomeCategories}
              hiddenCategories={hiddenIncomeCategories}
              userId={userId}
              onChanged={refresh}
            />
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
