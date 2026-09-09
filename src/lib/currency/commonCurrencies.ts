export interface CurrencyOption {
  code: string;
  label: string;
}

// 現金入力フォームの通貨セレクトに出す候補。世界一周・ノマド旅行で
// 実際によく使う主要通貨に絞る(全通貨を出すと選びにくくなるため)。
export const COMMON_CURRENCIES: CurrencyOption[] = [
  { code: "JPY", label: "日本円" },
  { code: "USD", label: "米ドル" },
  { code: "EUR", label: "ユーロ" },
  { code: "GBP", label: "英ポンド" },
  { code: "THB", label: "タイバーツ" },
  { code: "VND", label: "ベトナムドン" },
  { code: "IDR", label: "インドネシアルピア" },
  { code: "MYR", label: "マレーシアリンギット" },
  { code: "SGD", label: "シンガポールドル" },
  { code: "PHP", label: "フィリピンペソ" },
  { code: "KRW", label: "韓国ウォン" },
  { code: "TWD", label: "台湾ドル" },
  { code: "CNY", label: "中国元" },
  { code: "HKD", label: "香港ドル" },
  { code: "INR", label: "インドルピー" },
  { code: "AUD", label: "豪ドル" },
  { code: "NZD", label: "ニュージーランドドル" },
  { code: "CAD", label: "カナダドル" },
  { code: "MXN", label: "メキシコペソ" },
  { code: "TRY", label: "トルコリラ" },
  { code: "AED", label: "UAEディルハム" },
];
