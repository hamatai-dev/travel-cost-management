import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "@/types/transaction";
import { resolveCategoryId } from "./resolveCategory";
import { sortCategoriesByPreference } from "./sortCategoriesByPreference";
import {
  fetchCategoryColors,
  fetchCategorySortOrder,
  fetchHiddenCategoryIds,
} from "./supabaseCategoryPreferences";

/**
 * ログイン中のユーザーが選択できるカテゴリ一覧(共通デフォルト + 自分のカスタム分)。
 * このユーザーが非表示にしたものは除外し、並び順の指定があればそれを反映する。
 */
export async function listSelectableCategories(
  supabase: SupabaseClient,
  userId: string,
): Promise<Category[]> {
  const [{ data, error }, hiddenIds, sortOrderMap, colorMap] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order("is_default", { ascending: false })
      .order("name"),
    // 非表示・並び順・色のテーブルはマイグレーション未適用の環境ではまだ存在しない
    // ことがあるため、その場合でもカテゴリ一覧自体は使えるようにフォールバックする。
    fetchHiddenCategoryIds(supabase, userId).catch(() => new Set<string>()),
    fetchCategorySortOrder(supabase, userId).catch(() => new Map<string, number>()),
    fetchCategoryColors(supabase, userId).catch(() => new Map<string, string>()),
  ]);

  if (error) throw new Error(`カテゴリ一覧の取得に失敗しました: ${error.message}`);

  const visible = (data ?? [])
    .filter((c) => !hiddenIds.has(c.id))
    .map((c) => ({ ...c, color: colorMap.get(c.id) ?? null }));
  return sortCategoriesByPreference(visible, sortOrderMap);
}

/** このユーザーが非表示にしたカテゴリの詳細一覧(設定画面の「再表示」用)。 */
export async function fetchHiddenCategories(
  supabase: SupabaseClient,
  userId: string,
): Promise<Category[]> {
  const hiddenIds = await fetchHiddenCategoryIds(supabase, userId).catch(
    () => new Set<string>(),
  );
  if (hiddenIds.size === 0) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .in("id", Array.from(hiddenIds))
    .order("name");

  if (error) throw new Error(`非表示カテゴリの取得に失敗しました: ${error.message}`);
  return data ?? [];
}

export async function resolveCategoryIdByName(
  supabase: SupabaseClient,
  userId: string,
  categoryName: string | undefined,
): Promise<string | null> {
  return resolveCategoryId(categoryName, {
    findCategoryIdByName: async (name) => {
      const { data } = await supabase
        .from("categories")
        .select("id")
        .or(`user_id.eq.${userId},user_id.is.null`)
        .eq("name", name)
        .limit(1)
        .maybeSingle();
      return data?.id ?? null;
    },
  });
}
