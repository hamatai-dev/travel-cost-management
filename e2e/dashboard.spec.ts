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

  test("Given これまでの取引データがある, When ダッシュボードを開く, Then 総残高・円グラフとカテゴリ別内訳が表示される", async ({
    page,
  }) => {
    // Given / When
    await page.goto("/dashboard");

    // Then: 為替レート解決を挟むため少し余裕を持って待つ
    await expect(page.getByText(/現在の総残高/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("img", { name: "支出と収入の内訳円グラフ" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "カテゴリ" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "支払い種別" })).toBeVisible();
  });

  test("Given これまでの取引データがある(収入含む), When ダッシュボードを開く, Then 収支と収入タブが表示される", async ({
    page,
  }) => {
    // Given / When
    await page.goto("/dashboard");
    await expect(page.getByText(/現在の総残高/)).toBeVisible({ timeout: 15000 });

    // Then
    await expect(page.getByText(/収支 [+¥-]/)).toBeVisible();
    await page.getByRole("tab", { name: "収入" }).click();
    await expect(page.getByRole("tabpanel", { name: "収入" })).toBeVisible();
  });

  test("Given ダッシュボードを開く, When 年・月を指定して絞り込む, Then 選択した年月の内訳表示に更新される", async ({
    page,
  }) => {
    // Given
    await page.goto("/dashboard");
    await expect(page.getByText(/現在の総残高/)).toBeVisible({ timeout: 15000 });
    // combobox の並びは [0]年 [1]月
    const yearSelect = page.getByRole("combobox").nth(0);
    const monthSelect = page.getByRole("combobox").nth(1);

    // When
    await yearSelect.click();
    await page.getByRole("option", { name: "2026年" }).click();
    await monthSelect.click();
    await page.getByRole("option", { name: "6月" }).click();

    // Then: 期間切り替え後も総残高・内訳は表示され、選択した年月が反映される
    await expect(page.getByText(/現在の総残高/)).toBeVisible({ timeout: 15000 });
    await expect(yearSelect).toContainText("2026年");
    await expect(monthSelect).toContainText("6月");
    await expect(page.getByText("2026年6月の内訳")).toBeVisible();
  });
});
