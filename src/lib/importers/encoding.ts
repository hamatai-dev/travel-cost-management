// 三井住友カード・エポスカードのCSVは Shift-JIS、楽天カード・Wise は UTF-8。
// UTF-8 として厳密デコードを試み、失敗したら Shift-JIS にフォールバックする。
export function decodeCsvBuffer(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("shift_jis").decode(buffer);
  }
}
