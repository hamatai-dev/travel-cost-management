export interface CategoryColorOption {
  name: string;
  value: string;
}

// 自由入力にはせず、主要な色から選ばせることでカテゴリ間の見た目のばらつきを抑える
export const CATEGORY_COLOR_PALETTE: CategoryColorOption[] = [
  { name: "レッド", value: "#ef4444" },
  { name: "オレンジ", value: "#f97316" },
  { name: "アンバー", value: "#f59e0b" },
  { name: "イエロー", value: "#eab308" },
  { name: "ライム", value: "#84cc16" },
  { name: "グリーン", value: "#22c55e" },
  { name: "ティール", value: "#14b8a6" },
  { name: "シアン", value: "#06b6d4" },
  { name: "ブルー", value: "#3b82f6" },
  { name: "インディゴ", value: "#6366f1" },
  { name: "パープル", value: "#a855f7" },
  { name: "ピンク", value: "#ec4899" },
  { name: "グレー", value: "#6b7280" },
];
