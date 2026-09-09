import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import type { LocalTransaction } from "@/types/localTransaction";
import { createSupabaseInsert } from "./supabaseSync";

function makeLocalTx(overrides: Partial<LocalTransaction> = {}): LocalTransaction {
  return {
    clientUuid: "client-uuid-1",
    date: "2026-09-08",
    merchant: "屋台のタコス",
    amountOriginal: 500,
    currencyOriginal: "JPY",
    source: "cash",
    transactionType: "expense",
    dedupeHash: "client-uuid-1",
    createdAt: "2026-09-08T10:00:00.000Z",
    ...overrides,
  };
}

function mockSupabase(error: { code: string } | null) {
  const insert = vi.fn().mockResolvedValue({ error });
  const from = vi.fn().mockReturnValue({ insert });
  return { supabase: { from } as unknown as SupabaseClient, from, insert };
}

describe("createSupabaseInsert", () => {
  it("Given insertがエラーなく成功する, When 生成したinsert関数を呼ぶ, Then 'inserted' を返す", async () => {
    // Given
    const { supabase } = mockSupabase(null);
    const insertFn = createSupabaseInsert(supabase, {
      userId: "user-1",
      accountId: "account-cash",
      resolveCategoryId: async () => null,
    });

    // When
    const outcome = await insertFn(makeLocalTx());

    // Then
    expect(outcome).toBe("inserted");
  });

  it("Given ユニーク制約違反(23505)でinsertが失敗する, When 生成したinsert関数を呼ぶ, Then 'already_synced' を返す(冪等な再送とみなす)", async () => {
    // Given
    const { supabase } = mockSupabase({ code: "23505" });
    const insertFn = createSupabaseInsert(supabase, {
      userId: "user-1",
      accountId: "account-cash",
      resolveCategoryId: async () => null,
    });

    // When
    const outcome = await insertFn(makeLocalTx());

    // Then
    expect(outcome).toBe("already_synced");
  });

  it("Given ユニーク制約違反以外のエラーでinsertが失敗する, When 生成したinsert関数を呼ぶ, Then 'failed' を返す", async () => {
    // Given
    const { supabase } = mockSupabase({ code: "500" });
    const insertFn = createSupabaseInsert(supabase, {
      userId: "user-1",
      accountId: "account-cash",
      resolveCategoryId: async () => null,
    });

    // When
    const outcome = await insertFn(makeLocalTx());

    // Then
    expect(outcome).toBe("failed");
  });

  it("Given ローカルの取引データにcategoryNameが含まれる, When 生成したinsert関数を呼ぶ, Then resolveCategoryIdで解決したIDを含めてinsertを呼ぶ", async () => {
    // Given
    const { supabase, from, insert } = mockSupabase(null);
    const resolveCategoryId = vi.fn().mockResolvedValue("category-food");
    const insertFn = createSupabaseInsert(supabase, {
      userId: "user-1",
      accountId: "account-cash",
      resolveCategoryId,
    });

    // When
    await insertFn(makeLocalTx({ categoryName: "食費" }));

    // Then
    expect(resolveCategoryId).toHaveBeenCalledWith("食費");
    expect(from).toHaveBeenCalledWith("transactions");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        account_id: "account-cash",
        category_id: "category-food",
        dedupe_hash: "client-uuid-1",
        client_uuid: "client-uuid-1",
        amount_original: 500,
        currency_original: "JPY",
      }),
    );
  });

  it("Given ローカルの取引データのtransactionTypeがincome, When 生成したinsert関数を呼ぶ, Then transaction_type: 'income' を含めてinsertを呼ぶ", async () => {
    // Given
    const { supabase, insert } = mockSupabase(null);
    const insertFn = createSupabaseInsert(supabase, {
      userId: "user-1",
      accountId: "account-cash",
      resolveCategoryId: async () => null,
    });

    // When
    await insertFn(makeLocalTx({ transactionType: "income" }));

    // Then
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ transaction_type: "income" }),
    );
  });
});
