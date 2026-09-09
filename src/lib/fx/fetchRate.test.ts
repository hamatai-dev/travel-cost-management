import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchJpyRate } from "./fetchRate";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("fetchJpyRate", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Given 通貨がJPY, When fetchJpyRate を呼ぶ, Then APIを呼ばずレート1を返す", async () => {
    // Given / When
    const rate = await fetchJpyRate("2026-06-02", "JPY");

    // Then
    expect(rate).toBe(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("Given 主系(jsdelivr)から正常にレートが取得できる, When fetchJpyRate を呼ぶ, Then そのレートを返し副系は呼ばない", async () => {
    // Given
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ date: "2026-06-02", usd: { jpy: 159.75 } }),
    );

    // When
    const rate = await fetchJpyRate("2026-06-02", "USD");

    // Then
    expect(rate).toBe(159.75);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain("cdn.jsdelivr.net");
  });

  it("Given 主系が失敗(non-ok)する, When fetchJpyRate を呼ぶ, Then 副系にフォールバックしてレートを返す", async () => {
    // Given
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(null, false))
      .mockResolvedValueOnce(
        jsonResponse({ date: "2026-06-02", usd: { jpy: 159.75 } }),
      );

    // When
    const rate = await fetchJpyRate("2026-06-02", "USD");

    // Then
    expect(rate).toBe(159.75);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetch).mock.calls[1][0]).toContain(
      "currency-api.pages.dev",
    );
  });

  it("Given 主系がネットワークエラーで例外を投げる, When fetchJpyRate を呼ぶ, Then 副系にフォールバックする", async () => {
    // Given
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce(
        jsonResponse({ date: "2026-06-02", usd: { jpy: 159.75 } }),
      );

    // When
    const rate = await fetchJpyRate("2026-06-02", "USD");

    // Then
    expect(rate).toBe(159.75);
  });

  it("Given 主系・副系ともに失敗する, When fetchJpyRate を呼ぶ, Then nullを返す(未確定のまま呼び出し側に委ねる)", async () => {
    // Given
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(null, false))
      .mockResolvedValueOnce(jsonResponse(null, false));

    // When
    const rate = await fetchJpyRate("2026-06-02", "USD");

    // Then
    expect(rate).toBeNull();
  });
});
