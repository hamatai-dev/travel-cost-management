"use client";

import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { KeypadKey } from "@/lib/input/numericKeypadInput";

const ROWS: KeypadKey[][] = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["clear", "0", "backspace"],
];

interface NumericKeypadProps {
  onKey: (key: KeypadKey) => void;
}

/**
 * 金額入力用のテンキー風UI。電卓と同じ並び(7 8 9 / 4 5 6 / 1 2 3 / C 0 ⌫)の
 * 3列グリッドで、OS標準の数字キーボードより大きく押しやすいボタンにしている。
 * オフラインでもすぐ・素早く1件記録したい旅行中の利用シーンに合わせている。
 */
export function NumericKeypad({ onKey }: NumericKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-2">
      {ROWS.flat().map((key) => (
        <Button
          key={key}
          type="button"
          variant={key === "clear" || key === "backspace" ? "outline" : "secondary"}
          className="h-13 rounded-md text-xl font-medium tabular-nums shadow-sm"
          aria-label={key === "backspace" ? "1文字削除" : key === "clear" ? "クリア" : key}
          onClick={() => onKey(key)}
        >
          {key === "backspace" ? (
            <Delete className="size-5" />
          ) : key === "clear" ? (
            "C"
          ) : (
            key
          )}
        </Button>
      ))}
    </div>
  );
}
