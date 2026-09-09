export type KeypadKey =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "."
  | "backspace"
  | "clear";

// 金額として現実的な範囲を大きく超える桁数の誤入力を防ぐための上限
// (小数点を含む文字数。例: "1234567890" で10桁)。
const MAX_LENGTH = 10;

/**
 * テンキーで金額欄(文字列)を1キー分更新する。フォームの<input>には依存しない
 * 純粋関数にすることで、キーの挙動(先頭ゼロの扱い・小数点の重複防止など)を
 * UIから切り離してテストできるようにする。
 */
export function appendKeypadDigit(current: string, key: KeypadKey): string {
  if (key === "clear") return "";
  if (key === "backspace") return current.slice(0, -1);

  if (key === ".") {
    // 小数点は1つまで。まだ何も入力していない状態から押した場合は "0." から始める
    if (current.includes(".")) return current;
    return current === "" ? "0." : current + ".";
  }

  // 数字キー
  if (current === "0") return key; // "05" のような先頭ゼロ表記を防ぎ、置き換える
  if (current.length >= MAX_LENGTH) return current;
  return current + key;
}
