"use client";

import { useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  parseCsvFile,
  UnrecognizedCsvFormatError,
  type ParseCsvResult,
} from "@/lib/importers";
import { createClient } from "@/lib/supabase/client";
import type { ImportOutcome } from "@/lib/transactions/csvImport";
import { runCsvImport } from "@/lib/transactions/runCsvImport";

type State =
  | { step: "idle" }
  | { step: "previewing"; fileName: string; parsed: ParseCsvResult }
  | { step: "importing"; fileName: string; parsed: ParseCsvResult }
  | { step: "done"; outcome: ImportOutcome };

const PREVIEW_ROW_COUNT = 10;

export default function ImportPage() {
  const [state, setState] = useState<State>({ step: "idle" });

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じファイルを連続で選び直せるようにする
    if (!file) return;

    try {
      const parsed = await parseCsvFile(file);
      setState({ step: "previewing", fileName: file.name, parsed });
    } catch (err) {
      toast.error(
        err instanceof UnrecognizedCsvFormatError
          ? err.message
          : "CSVの読み込みに失敗しました。ファイルを確認してください。",
      );
    }
  }

  async function handleImport() {
    if (state.step !== "previewing") return;
    const { fileName, parsed } = state;
    setState({ step: "importing", fileName, parsed });

    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) throw new Error("ログイン情報が確認できませんでした。");

      const outcome = await runCsvImport(supabase, userId, parsed, fileName);
      setState({ step: "done", outcome });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "インポートに失敗しました。");
      setState({ step: "previewing", fileName, parsed });
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4">
      <div>
        <h1 className="text-xl font-semibold">CSVインポート</h1>
        <p className="text-sm text-muted-foreground">
          三井住友カード・エポスカード・楽天カード・Wiseの明細CSVに対応しています。
        </p>
      </div>

      <div>
        <label
          htmlFor="csvFile"
          className="block cursor-pointer rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground hover:bg-accent/50"
        >
          CSVファイルを選択
        </label>
        <input
          id="csvFile"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {(state.step === "previewing" || state.step === "importing") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {state.parsed.adapter.label}の明細として認識しました(
              {state.parsed.transactions.length}件、ファイル: {state.fileName})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>店名</TableHead>
                    <TableHead>金額</TableHead>
                    <TableHead>カテゴリ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.parsed.transactions
                    .slice(0, PREVIEW_ROW_COUNT)
                    .map((t, i) => (
                      <TableRow key={i}>
                        <TableCell>{t.date}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {t.merchant}
                        </TableCell>
                        <TableCell>
                          {t.amountOriginal.toLocaleString()} {t.currencyOriginal}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.category ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            {state.parsed.transactions.length > PREVIEW_ROW_COUNT && (
              <p className="text-xs text-muted-foreground">
                他 {state.parsed.transactions.length - PREVIEW_ROW_COUNT} 件は省略して表示しています
              </p>
            )}

            <Button
              onClick={handleImport}
              disabled={state.step === "importing"}
              className="w-full"
            >
              {state.step === "importing" ? "インポート中..." : "インポートする"}
            </Button>
          </CardContent>
        </Card>
      )}

      {state.step === "done" && (
        <p className="text-sm text-green-600">
          {state.outcome.insertedCount}件取り込みました。
          {state.outcome.duplicateCount > 0 &&
            `(${state.outcome.duplicateCount}件は既存データと重複のためスキップ)`}
        </p>
      )}
    </main>
  );
}
