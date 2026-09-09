// 店名からカテゴリを推測するルールベースの分類。
// Wiseのようにインポート元が既にカテゴリを持っている場合はこちらを使わず、
// それ以外(三井住友/エポス/楽天のCSV、手入力でカテゴリ未選択の現金支出)の
// 補完に使う。上から順に判定し、最初にマッチしたルールを採用する。
const CATEGORY_RULES: Array<{ category: string; keywords: string[] }> = [
  {
    category: "宿泊",
    keywords: ["AIRBNB", "HOTEL", "HOSTEL", "AGODA", "BOOKING.COM"],
  },
  {
    category: "交通",
    keywords: [
      "UBER",
      "GRAB",
      "TAXI",
      "GREYHOUND",
      "FRONTIER",
      "AIRLINE",
      "ANA ",
      "JAL ",
    ],
  },
  {
    category: "外食",
    keywords: ["STARBUCKS", "CAFE", "COFFEE", "RESTAURANT", "MCDONALD"],
  },
  {
    category: "食費",
    keywords: [
      "SUPERMARKET",
      "SEVEN",
      "OXXO",
      "SORIANA",
      "WALMART",
      "GROCERY",
    ],
  },
  {
    category: "通信",
    keywords: ["NETFLIX", "SPOTIFY", "APPLE.COM", "AMAZON WEB", "AWS"],
  },
];

export function inferCategoryFromMerchant(merchant: string): string | null {
  const upper = merchant.toUpperCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => upper.includes(keyword))) {
      return rule.category;
    }
  }
  return null;
}
