import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "@/types/transaction";
import { resolveCategoryId } from "./resolveCategory";

/** ログイン中のユーザーが選択できるカテゴリ一覧(共通デフォルト + 自分のカスタム分)。 */
export async function listSelectableCategories(
  supabase: SupabaseClient,
  userId: string,
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order("is_default", { ascending: false })
    .order("name");

  if (error) throw new Error(`カテゴリ一覧の取得に失敗しました: ${error.message}`);
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
