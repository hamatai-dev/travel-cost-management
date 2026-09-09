import { z } from "zod";

/**
 * カテゴリ名・口座名など、「空でない・長すぎない・前後空白を無視する」という
 * 共通ルールを持つ名前系の入力に使う zod スキーマを作る。
 */
export function createNameSchema(label: string, maxLength = 20) {
  return z
    .string()
    .trim()
    .min(1, `${label}を入力してください`)
    .max(maxLength, `${maxLength}文字以内で入力してください`);
}
