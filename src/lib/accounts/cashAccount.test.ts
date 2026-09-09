import { describe, expect, it, vi } from "vitest";
import { getOrCreateCashAccountId } from "./cashAccount";

describe("getOrCreateCashAccountId", () => {
  it("Given ユーザーに既に現金口座が存在する, When getOrCreateCashAccountId を呼ぶ, Then 既存のIDを返し新規作成しない", async () => {
    // Given
    const findCashAccountId = vi.fn().mockResolvedValue("existing-account-id");
    const createCashAccount = vi.fn();

    // When
    const result = await getOrCreateCashAccountId({
      findCashAccountId,
      createCashAccount,
    });

    // Then
    expect(result).toBe("existing-account-id");
    expect(createCashAccount).not.toHaveBeenCalled();
  });

  it("Given ユーザーに現金口座が存在しない, When getOrCreateCashAccountId を呼ぶ, Then 新規作成しそのIDを返す", async () => {
    // Given
    const findCashAccountId = vi.fn().mockResolvedValue(null);
    const createCashAccount = vi.fn().mockResolvedValue("new-account-id");

    // When
    const result = await getOrCreateCashAccountId({
      findCashAccountId,
      createCashAccount,
    });

    // Then
    expect(result).toBe("new-account-id");
    expect(createCashAccount).toHaveBeenCalledTimes(1);
  });
});
