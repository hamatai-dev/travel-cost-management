export interface CurrencyOption {
  code: string;
  label: string;
}

// 現金入力フォームの通貨セレクトに出す候補。実際に使う主要通貨に絞る。
export const COMMON_CURRENCIES: CurrencyOption[] = [
  { code: "JPY", label: "日本円" },
  { code: "USD", label: "米ドル" },
  { code: "MXN", label: "メキシコペソ" },
  { code: "TWD", label: "台湾ドル" },
];
