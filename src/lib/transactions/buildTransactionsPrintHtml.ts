import type { TransactionType } from "@/types/transaction";
import type { ExportableTransaction } from "./buildTransactionsCsv";

const TYPE_LABEL: Record<TransactionType, string> = {
  expense: "支出",
  income: "収入",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 取引データを、ブラウザの印刷機能(「PDFとして保存」)でPDF化するための
 * 印刷用HTML文書に変換する。jsPDF等のライブラリは日本語フォントを別途
 * 埋め込まないと文字化けするため、ブラウザ自身のレンダリングを使う方式にしている。
 */
export function buildTransactionsPrintHtml(
  rows: ExportableTransaction[],
  periodLabel: string,
): string {
  const totalExpenseJpy = rows
    .filter((r) => r.transactionType === "expense")
    .reduce((sum, r) => sum + (r.amountJpy ?? 0), 0);
  const totalIncomeJpy = rows
    .filter((r) => r.transactionType === "income")
    .reduce((sum, r) => sum + (r.amountJpy ?? 0), 0);

  const bodyRows = rows
    .map(
      (r) => `<tr>
        <td>${escapeHtml(r.date)}</td>
        <td>${escapeHtml(TYPE_LABEL[r.transactionType])}</td>
        <td>${escapeHtml(r.merchant ?? "")}</td>
        <td>${escapeHtml(r.categoryName)}</td>
        <td>${escapeHtml(r.accountName)}</td>
        <td class="num">${r.amountOriginal.toLocaleString()} ${escapeHtml(r.currencyOriginal)}</td>
        <td class="num">${r.amountJpy != null ? `&yen;${r.amountJpy.toLocaleString()}` : ""}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<title>取引一覧(${escapeHtml(periodLabel)})</title>
<style>
  body { font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif; padding: 24px; color: #111; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p.meta { color: #555; font-size: 12px; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
  th { background: #f3f3f3; }
  td.num, th.num { text-align: right; }
  tfoot td { font-weight: bold; border-top: 2px solid #333; }
  @media print {
    @page { margin: 16mm; }
  }
</style>
</head>
<body>
  <h1>取引一覧</h1>
  <p class="meta">期間: ${escapeHtml(periodLabel)} ・ ${rows.length}件 ・ 出力日: ${escapeHtml(new Date().toLocaleDateString("ja-JP"))}</p>
  <table>
    <thead>
      <tr>
        <th>日付</th><th>種別</th><th>支払い先</th><th>カテゴリ</th><th>支払い種別</th>
        <th class="num">金額</th><th class="num">円換算</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
    <tfoot>
      <tr><td colspan="6">支出合計</td><td class="num">&yen;${totalExpenseJpy.toLocaleString()}</td></tr>
      <tr><td colspan="6">収入合計</td><td class="num">&yen;${totalIncomeJpy.toLocaleString()}</td></tr>
    </tfoot>
  </table>
</body>
</html>`;
}
