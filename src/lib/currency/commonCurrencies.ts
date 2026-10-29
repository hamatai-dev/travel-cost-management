export interface CurrencyOption {
  code: string;
  label: string;
  // この通貨が使われる国が一意に決まる場合のみ設定する(USDのように複数国で使われる通貨は未設定)
  country?: string;
}

// 現金入力フォームの通貨セレクトに出す候補。実際に使う主要通貨に絞る。
export const COMMON_CURRENCIES: CurrencyOption[] = [
  { code: "JPY", label: "日本円", country: "日本" },
  { code: "USD", label: "米ドル" },
  { code: "MXN", label: "メキシコペソ", country: "メキシコ" },
  { code: "TWD", label: "台湾ドル", country: "台湾" },
  { code: "GTQ", label: "グアテマラ・ケツァル", country: "グアテマラ" },
  { code: "NIO", label: "ニカラグア・コルドバ", country: "ニカラグア" },
  { code: "CRC", label: "コスタリカ・コロン", country: "コスタリカ" },
  { code: "COP", label: "コロンビアペソ", country: "コロンビア" },
];
