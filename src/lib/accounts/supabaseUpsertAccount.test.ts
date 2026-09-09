import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { createOrFetchAccount } from "./supabaseUpsertAccount";

function mockSupabase(insertResult: { data: { id: string } | null; error: { code: string; message: string } | null }, fetchResult?: { data: { id: string } | null; error: unknown }) {
  const insertSingle = vi.fn().mockResolvedValue(insertResult);
  const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
  const insert = vi.fn().mockReturnValue({ select: insertSelect });

  const fetchSingle = vi.fn().mockResolvedValue(fetchResult ?? { data: null, error: null });
  const fetchEq3 = vi.fn().mockReturnValue({ single: fetchSingle });
  const fetchEq2 = vi.fn().mockReturnValue({ eq: fetchEq3 });
  const fetchEq1 = vi.fn().mockReturnValue({ eq: fetchEq2 });
  const select = vi.fn().mockReturnValue({ eq: fetchEq1 });

  const from = vi.fn().mockReturnValue({ insert, select });
  return { supabase: { from } as unknown as SupabaseClient, insert, select };
}

describe("createOrFetchAccount", () => {
  it("Given insertがエラーなく成功する, When createOrFetchAccount を呼ぶ, Then 作成した口座のIDを返す", async () => {
    // Given
    const { supabase } = mockSupabase({ data: { id: "account-1" }, error: null });

    // When
    const id = await createOrFetchAccount(supabase, "user-1", "現金", "cash");

    // Then
    expect(id).toBe("account-1");
  });

  it("Given unique制約違反(23505)で失敗するが既存の口座が取得できる, When createOrFetchAccount を呼ぶ, Then エラーにせず既存の口座IDを返す(現金口座の二重作成を防ぐ)", async () => {
    // Given: 別のリクエストが先に同じ「現金」口座を作っていたケースを想定
    const { supabase } = mockSupabase(
      { data: null, error: { code: "23505", message: "duplicate" } },
      { data: { id: "existing-cash-account" }, error: null },
    );

    // When
    const id = await createOrFetchAccount(supabase, "user-1", "現金", "cash");

    // Then
    expect(id).toBe("existing-cash-account");
  });

  it("Given unique制約違反以外のエラーで失敗する, When createOrFetchAccount を呼ぶ, Then エラーを投げる", async () => {
    // Given
    const { supabase } = mockSupabase({
      data: null,
      error: { code: "500", message: "server error" },
    });

    // When / Then
    await expect(createOrFetchAccount(supabase, "user-1", "現金", "cash")).rejects.toThrow();
  });
});
