import { expect, test } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_TEST_EMAIL;
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD;

// 他のE2Eシナリオ(cash-entry, csv-import)が同じテストアカウントに残した
// データを前提に、ダッシュボードが集計・表示できることを確認する。
test.describe("ダッシュボード(主要シナリオ)", () => {
  test.skip(
    !E2E_EMAIL || !E2E_PASSWORD,
    "E2E_TEST_EMAIL / E2E_TEST_PASSWORD が未設定のためスキップします。README.md参照。",
  );

  test.beforeEach(async ({ page }) => {
    const response = await page.request.post("/api/e2e-login", {
      data: { email: E2E_EMAIL, password: E2E_PASSWORD },
    });
    expect(response.ok()).toBe(true);
  });

  test("Given これまでの取引データがある, When ダッシュボードを開く, Then 合計支出とカテゴリ別内訳が表示される", async ({
    page,
  }) => {
    // Given / When
    await page.goto("/dashboard");

    // Then: 為替レート解決を挟むため少し余裕を持って待つ
    await expect(page.getByText(/合計支出/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("tab", { name: "カテゴリ" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "支払い種別" })).toBeVisible();
  });

  test("Given これまでの取引データがある(収入含む), When ダッシュボードを開く, Then 収支サマリーと収入タブが表示される", async ({
    page,
  }) => {
    // Given / When
    await page.goto("/dashboard");
    await expect(page.getByText(/合計支出/)).toBeVisible({ timeout: 15000 });

    // Then
    await expect(page.getByText(/収支/)).toBeVisible();
    await page.getByRole("tab", { name: "収入" }).click();
    await expect(page.getByRole("tabpanel", { name: "収入" })).toBeVisible();
  });

  test("Given ダッシュボードを開く, When 期間を「今月」に切り替える, Then 表示が更新される", async ({
    page,
  }) => {
    // Given
    await page.goto("/dashboard");
    await expect(page.getByText(/合計支出/)).toBeVisible({ timeout: 15000 });

    // When
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "今月" }).click();

    // Then: 期間切り替え後も合計支出は表示される
    await expect(page.getByText(/合計支出/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("combobox")).toContainText("今月");
  });

  test("Given ダッシュボードを開く, When 期間を「今週」に切り替える, Then 週次の表示に更新される", async ({
    page,
  }) => {
    // Given
    await page.goto("/dashboard");
    await expect(page.getByText(/合計支出/)).toBeVisible({ timeout: 15000 });

    // When
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "今週" }).click();

    // Then
    await expect(page.getByText(/合計支出/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("combobox")).toContainText("今週");
  });
});
