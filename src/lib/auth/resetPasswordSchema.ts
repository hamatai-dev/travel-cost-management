import { z } from "zod";

/** パスワードリセットメールの送信リクエスト(ログイン画面の「忘れた場合」フォーム)。 */
export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "メールアドレスを入力してください")
    .email("メールアドレスの形式が正しくありません"),
});

/**
 * リセットメールのリンクから遷移した先(/reset-password)での新パスワード入力。
 * 確認用入力との一致もここで検証する。
 */
export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "パスワードは8文字以上で入力してください"),
    confirmPassword: z.string().min(1, "確認用のパスワードを入力してください"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
