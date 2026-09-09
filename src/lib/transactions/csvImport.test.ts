import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import type { ImportRow } from "./buildImportRows";
import { insertImportRows } from "./csvImport";

function makeRow(overrides: Partial<ImportRow> = {}): ImportRow {
  return {
    accountId: "account-1",
    date: "2026-06-02",
    merchant: "ＡＭＡＺＯＮ　ＷＥＢ",
    amountOriginal: 14665,
    currencyOriginal: "JPY",
    amountJpy: 14665,
    source: "csv_import",
    dedupeHash: "hash-1",
    ...overrides,
  };
}

function mockSupabase(insertedIds: { id: string }[]) {
  const select = vi.fn().mockResolvedValue({ data: insertedIds, error: null });
  const upsert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ upsert });
  return { supabase: { from } as unknown as SupabaseClient, from, upsert, select };
}

describe("insertImportRows", () => {
  it("Given 全件が新規でユニーク制約に衝突しない, When insertImportRows を呼ぶ, Then 全件がinsertedCountに計上され重複は0件になる", async () => {
    // Given: 3件送って3件とも返ってくる = 重複なし
    const rows = [makeRow({ dedupeHash: "h1" }), makeRow({ dedupeHash: "h2" }), makeRow({ dedupeHash: "h3" })];
    const { supabase } = mockSupabase([{ id: "1" }, { id: "2" }, { id: "3" }]);

    // When
    const result = await insertImportRows(supabase, "user-1", rows, "batch-1");

    // Then
    expect(result).toEqual({ insertedCount: 3, duplicateCount: 0 });
  });

  it("Given 一部がdedupe_hashの衝突でスキップされる(再取込・期間重複), When insertImportRows を呼ぶ, Then 実際に挿入された件数との差分をduplicateCountとして返す", async () => {
    // Given: 5件送ったが、ユニーク制約により2件だけ実際に挿入された
    const rows = Array.from({ length: 5 }, (_, i) => makeRow({ dedupeHash: `h${i}` }));
    const { supabase } = mockSupabase([{ id: "1" }, { id: "2" }]);

    // When
    const result = await insertImportRows(supabase, "user-1", rows, "batch-1");

    // Then
    expect(result).toEqual({ insertedCount: 2, duplicateCount: 3 });
  });

  it("Given インポートする行が1件もない, When insertImportRows を呼ぶ, Then Supabaseを呼ばずに0件を返す", async () => {
    // Given
    const { supabase, from } = mockSupabase([]);

    // When
    const result = await insertImportRows(supabase, "user-1", [], "batch-1");

    // Then
    expect(result).toEqual({ insertedCount: 0, duplicateCount: 0 });
    expect(from).not.toHaveBeenCalled();
  });

  it("Given upsert時にonConflictとして dedupe_hash を指定する, When insertImportRows を呼ぶ, Then user_id,dedupe_hash の複合キーで重複判定させる", async () => {
    // Given
    const rows = [makeRow()];
    const { supabase, upsert } = mockSupabase([{ id: "1" }]);

    // When
    await insertImportRows(supabase, "user-1", rows, "batch-1");

    // Then
    expect(upsert).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        onConflict: "user_id,dedupe_hash",
        ignoreDuplicates: true,
      }),
    );
  });

  it("Given batchIdを指定する, When insertImportRows を呼ぶ, Then 各行にimport_batch_idとして含めて送る(あとで一括取消できるように)", async () => {
    // Given
    const rows = [makeRow(), makeRow({ dedupeHash: "h2" })];
    const { supabase, upsert } = mockSupabase([{ id: "1" }, { id: "2" }]);

    // When
    await insertImportRows(supabase, "user-1", rows, "batch-42");

    // Then
    const [payload] = upsert.mock.calls[0];
    expect(payload).toHaveLength(2);
    for (const row of payload) {
      expect(row.import_batch_id).toBe("batch-42");
    }
  });
});
