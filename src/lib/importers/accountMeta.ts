import type { AccountType } from "@/types/transaction";
import type { CsvAdapter } from "./types";

export interface AccountMeta {
  name: string;
  type: AccountType;
}

// どのCSVアダプターの取込結果を、どの口座名・口座種別に紐付けるか。
// 口座はこの名前+種別で find-or-create されるため、ここを間違えると
// 例えばWiseの支出が別のクレジットカード口座に紛れ込んでしまう。
const ADAPTER_ACCOUNT_META: Record<CsvAdapter["id"], AccountMeta> = {
  smbc: { name: "三井住友カード", type: "credit_card" },
  epos: { name: "エポスカード", type: "credit_card" },
  rakuten: { name: "楽天カード", type: "credit_card" },
  wise: { name: "Wise", type: "debit_card" },
};

export function accountMetaForAdapter(
  adapterId: CsvAdapter["id"],
): AccountMeta {
  return ADAPTER_ACCOUNT_META[adapterId];
}
