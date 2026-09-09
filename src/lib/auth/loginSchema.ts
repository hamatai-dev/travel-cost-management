import { z } from "zod";

/**
 * メールアドレス+パスワードログインフォームの入力検証。
 * Supabase側のパスワードポリシー(デフォルト最小6文字)より少し厳しめの
 * 8文字以上を最低ラインとして、フォーム側で早めに弾く。
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "メールアドレスを入力してください")
    .email("メールアドレスの形式が正しくありません"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

export type LoginInput = z.infer<typeof loginSchema>;
