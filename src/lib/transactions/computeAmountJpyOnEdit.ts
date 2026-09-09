export interface AmountJpyOnEdit {
  amountJpy: number | null;
  fxRate: number | null;
}

/**
 * 手動編集で金額・通貨を変更した際、キャッシュ済みの円換算額をどう扱うかを決める。
 * JPY建てならその場で確定できるが、外貨建てに変えた場合は古いレートのまま
 * 使うと不正確になるため、未確定に戻して次回ダッシュボード表示時に再計算させる。
 */
export function computeAmountJpyOnEdit(
  currencyOriginal: string,
  amountOriginal: number,
): AmountJpyOnEdit {
  if (currencyOriginal === "JPY") {
    return { amountJpy: amountOriginal, fxRate: 1 };
  }
  return { amountJpy: null, fxRate: null };
}
