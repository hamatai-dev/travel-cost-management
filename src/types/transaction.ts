export type AccountType = "credit_card" | "debit_card" | "cash";

export type TransactionSource = "csv_import" | "manual" | "cash";

// 支出か収入か。カテゴリの kind はこれに加えて両方で使える 'both' を取りうる。
export type TransactionType = "expense" | "income";
export type CategoryKind = TransactionType | "both";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  is_default: boolean;
  is_fixed_cost: boolean;
  kind: CategoryKind;
  created_at: string;
  // ユーザーごとの表示設定(バッジ色)。未設定ならnull。
  color: string | null;
}

// CSVアダプターが共通で出力する正規化済みレコード。
// この形になった時点でどのカード会社由来かは区別しなくてよい。
export interface NormalizedTransaction {
  date: string; // ISO 8601 (YYYY-MM-DD)
  merchant: string;
  memo?: string;
  amountOriginal: number;
  currencyOriginal: string; // 円建て確定額は "JPY"
  // 三井住友/エポス/楽天のCSVは円建て確定額を持つが、Wise/現金の現地通貨分は
  // ここでは未確定(analysis時にレートを引いて計算する)。
  amountJpy?: number;
  fxRate?: number;
  country?: string;
  city?: string;
  category?: string; // Wiseのように取込元に既存カテゴリがある場合のヒント
}

export interface Transaction extends NormalizedTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  source: TransactionSource;
  transaction_type: TransactionType;
  dedupe_hash: string;
  client_uuid?: string;
  created_at: string;
  synced_at?: string | null;
}
