import { describe, expect, it, vi } from "vitest";
import { getOrCreateAccountId } from "./resolveAccount";

describe("getOrCreateAccountId", () => {
  it("Given 対象の口座が既に存在する, When getOrCreateAccountId を呼ぶ, Then 既存のIDを返し新規作成しない", async () => {
    // Given
    const findAccountId = vi.fn().mockResolvedValue("existing-account-id");
    const createAccount = vi.fn();

    // When
    const result = await getOrCreateAccountId({ findAccountId, createAccount });

    // Then
    expect(result).toBe("existing-account-id");
    expect(createAccount).not.toHaveBeenCalled();
  });

  it("Given 対象の口座が存在しない, When getOrCreateAccountId を呼ぶ, Then 新規作成しそのIDを返す(CSVインポート初回時に口座を自動作成する用途を想定)", async () => {
    // Given
    const findAccountId = vi.fn().mockResolvedValue(null);
    const createAccount = vi.fn().mockResolvedValue("new-account-id");

    // When
    const result = await getOrCreateAccountId({ findAccountId, createAccount });

    // Then
    expect(result).toBe("new-account-id");
    expect(createAccount).toHaveBeenCalledTimes(1);
  });
});
