/**
 * 文字列が指定した文字数を超える場合、先頭からmaxLength文字に切り詰めて
 * 末尾に "..." を付ける。一覧表示など横幅が限られた場所で長さを揃えるために使う。
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
