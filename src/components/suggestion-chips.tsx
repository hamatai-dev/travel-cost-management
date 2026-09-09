"use client";

interface SuggestionChipsProps {
  values: string[];
  onSelect: (value: string) => void;
}

/** よく使う値をタップで選べる候補チップ。現金入力の店名・通貨・国などに使う。 */
export function SuggestionChips({ values, onSelect }: SuggestionChipsProps) {
  if (values.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pt-1.5">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {value}
        </button>
      ))}
    </div>
  );
}
