import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * このユーザーが「自分の一覧からは隠す」とした共有カテゴリ(デフォルト等)のID集合。
 * デフォルトカテゴリは全ユーザー共通のため直接削除できない代わりに使う仕組み。
 */
export async function fetchHiddenCategoryIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("category_hidden_for_user")
    .select("category_id")
    .eq("user_id", userId);

  if (error) throw new Error(`非表示カテゴリの取得に失敗しました: ${error.message}`);
  return new Set((data ?? []).map((r) => r.category_id as string));
}

export async function hideCategoryForUser(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
): Promise<void> {
  const { error } = await supabase
    .from("category_hidden_for_user")
    .upsert({ user_id: userId, category_id: categoryId }, { onConflict: "user_id,category_id" });

  if (error) throw new Error(`カテゴリの非表示化に失敗しました: ${error.message}`);
}

export async function unhideCategoryForUser(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
): Promise<void> {
  const { error } = await supabase
    .from("category_hidden_for_user")
    .delete()
    .eq("user_id", userId)
    .eq("category_id", categoryId);

  if (error) throw new Error(`カテゴリの再表示に失敗しました: ${error.message}`);
}

/** このユーザーが指定したカテゴリの並び順(category_id → 昇順の位置)。 */
export async function fetchCategorySortOrder(
  supabase: SupabaseClient,
  userId: string,
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("category_sort_order_for_user")
    .select("category_id, sort_order")
    .eq("user_id", userId);

  if (error) throw new Error(`カテゴリの並び順の取得に失敗しました: ${error.message}`);
  return new Map((data ?? []).map((r) => [r.category_id as string, r.sort_order as number]));
}

/**
 * ドラッグ&ドロップで確定した並び順を保存する。渡した配列の順序どおりに
 * 0始まりの連番を割り振ってまとめてupsertする。
 */
export async function saveCategorySortOrder(
  supabase: SupabaseClient,
  userId: string,
  orderedCategoryIds: string[],
): Promise<void> {
  if (orderedCategoryIds.length === 0) return;

  const rows = orderedCategoryIds.map((categoryId, index) => ({
    user_id: userId,
    category_id: categoryId,
    sort_order: index,
  }));

  const { error } = await supabase
    .from("category_sort_order_for_user")
    .upsert(rows, { onConflict: "user_id,category_id" });

  if (error) throw new Error(`並び順の保存に失敗しました: ${error.message}`);
}

/** このユーザーが指定したカテゴリのバッジ色(category_id → 色コード)。 */
export async function fetchCategoryColors(
  supabase: SupabaseClient,
  userId: string,
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("category_color_for_user")
    .select("category_id, color")
    .eq("user_id", userId);

  if (error) throw new Error(`カテゴリの色の取得に失敗しました: ${error.message}`);
  return new Map((data ?? []).map((r) => [r.category_id as string, r.color as string]));
}

/** カテゴリの色を保存する。colorにnullを渡すと設定を削除し、デフォルトの見た目に戻す。 */
export async function saveCategoryColorForUser(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  color: string | null,
): Promise<void> {
  if (color == null) {
    const { error } = await supabase
      .from("category_color_for_user")
      .delete()
      .eq("user_id", userId)
      .eq("category_id", categoryId);
    if (error) throw new Error(`カテゴリの色のリセットに失敗しました: ${error.message}`);
    return;
  }

  const { error } = await supabase
    .from("category_color_for_user")
    .upsert(
      { user_id: userId, category_id: categoryId, color },
      { onConflict: "user_id,category_id" },
    );

  if (error) throw new Error(`カテゴリの色の保存に失敗しました: ${error.message}`);
}
