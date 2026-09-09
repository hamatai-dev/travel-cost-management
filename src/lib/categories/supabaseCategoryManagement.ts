import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategoryKind } from "@/types/transaction";

export async function createCategory(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  kind: CategoryKind = "expense",
): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .insert({ user_id: userId, name, is_default: false, kind });
  if (error) throw new Error(`カテゴリの作成に失敗しました: ${error.message}`);
}

export async function renameCategory(
  supabase: SupabaseClient,
  categoryId: string,
  name: string,
): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", categoryId);
  if (error) throw new Error(`カテゴリの更新に失敗しました: ${error.message}`);
}

export async function deleteCategory(
  supabase: SupabaseClient,
  categoryId: string,
): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) throw new Error(`カテゴリの削除に失敗しました: ${error.message}`);
}

export async function setCategoryFixedCost(
  supabase: SupabaseClient,
  categoryId: string,
  isFixedCost: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .update({ is_fixed_cost: isFixedCost })
    .eq("id", categoryId);
  if (error) throw new Error(`カテゴリの更新に失敗しました: ${error.message}`);
}
