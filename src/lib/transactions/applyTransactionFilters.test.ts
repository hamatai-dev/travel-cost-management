import { describe, expect, it, vi } from "vitest";
import { applyTransactionFilters, type FilterableQuery } from "./applyTransactionFilters";

function mockQuery() {
  const q = {
    eq: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    or: vi.fn(),
  };
  q.eq.mockReturnValue(q);
  q.gte.mockReturnValue(q);
  q.lte.mockReturnValue(q);
  q.or.mockReturnValue(q);
  return q as typeof q & FilterableQuery<typeof q>;
}

describe("applyTransactionFilters", () => {
  it("Given フィルタが何も指定されていない, When applyTransactionFilters を呼ぶ, Then どのメソッドも呼ばず元のqueryをそのまま返す", () => {
    // Given
    const query = mockQuery();

    // When
    const result = applyTransactionFilters(query, {});

    // Then
    expect(result).toBe(query);
    expect(query.eq).not.toHaveBeenCalled();
    expect(query.gte).not.toHaveBeenCalled();
    expect(query.lte).not.toHaveBeenCalled();
    expect(query.or).not.toHaveBeenCalled();
  });

  it("Given accountId/categoryId/countryが指定されている, When applyTransactionFilters を呼ぶ, Then それぞれeqで絞り込む", () => {
    // Given
    const query = mockQuery();

    // When
    applyTransactionFilters(query, {
      accountId: "account-1",
      categoryId: "category-1",
      country: "メキシコ",
    });

    // Then
    expect(query.eq).toHaveBeenCalledWith("account_id", "account-1");
    expect(query.eq).toHaveBeenCalledWith("category_id", "category-1");
    expect(query.eq).toHaveBeenCalledWith("country", "メキシコ");
  });

  it("Given dateFrom/dateToが指定されている, When applyTransactionFilters を呼ぶ, Then gte/lteで期間を絞り込む", () => {
    // Given
    const query = mockQuery();

    // When
    applyTransactionFilters(query, {
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
    });

    // Then
    expect(query.gte).toHaveBeenCalledWith("date", "2026-06-01");
    expect(query.lte).toHaveBeenCalledWith("date", "2026-06-30");
  });

  it("Given transactionTypeが指定されている, When applyTransactionFilters を呼ぶ, Then eqで支出/収入を絞り込む", () => {
    // Given
    const query = mockQuery();

    // When
    applyTransactionFilters(query, { transactionType: "income" });

    // Then
    expect(query.eq).toHaveBeenCalledWith("transaction_type", "income");
  });

  it("Given searchが指定されている, When applyTransactionFilters を呼ぶ, Then 店名またはメモの部分一致で絞り込む", () => {
    // Given
    const query = mockQuery();

    // When
    applyTransactionFilters(query, { search: "タコス" });

    // Then
    expect(query.or).toHaveBeenCalledWith(
      'merchant.ilike."%タコス%",memo.ilike."%タコス%"',
    );
  });

  it("Given 検索語にカンマが含まれる, When applyTransactionFilters を呼ぶ, Then ダブルクォートで囲みor構文が壊れないようにする", () => {
    // Given
    const query = mockQuery();

    // When
    applyTransactionFilters(query, { search: "a,b" });

    // Then
    expect(query.or).toHaveBeenCalledWith(
      'merchant.ilike."%a,b%",memo.ilike."%a,b%"',
    );
  });
});
