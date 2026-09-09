import { z } from "zod";

export const transactionEditSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません"),
  merchant: z.string().trim().min(1, "支払い先を入力してください"),
  amountOriginal: z.coerce.number().positive("金額は正の数で入力してください"),
  currencyOriginal: z
    .string()
    .trim()
    .length(3, "通貨コードは3文字で入力してください")
    .transform((v) => v.toUpperCase()),
  categoryId: z.string().uuid().nullable(),
  transactionType: z.enum(["expense", "income"]),
  memo: z.string().trim().optional(),
  country: z.string().trim().optional(),
  city: z.string().trim().optional(),
});

export type TransactionEditInput = z.infer<typeof transactionEditSchema>;
