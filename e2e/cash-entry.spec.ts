import { expect, test } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_TEST_EMAIL;
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD;

// 現金支出の記録という「主要シナリオ」のE2E。ログインが前提のため、
// あらかじめ用意したテスト専用アカウント(実ユーザーの本アカウントとは別)が
// 必要になる。未設定の環境ではこのファイル自体をスキップする。
// セットアップ方法は README.md の「E2Eテストの実行」を参照。
test.describe("現金支出の記録(主要シナリオ)", () => {
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

  test("Given ログイン済みユーザー, When 金額と店名を入力して記録する, Then 一覧にその場で表示される", async ({
    page,
  }) => {
    // Given
    await page.goto("/entry");
    const merchantName = `E2Eテスト屋台-${Date.now()}`;

    // When
    await page.getByLabel("金額").fill("500");
    await page.getByLabel("店名(任意)").fill(merchantName);
    await page.getByRole("button", { name: "記録する" }).click();

    // Then: オフラインでも成立する保存(ローカルDB反映)がまず確認できること
    await expect(page.getByText("保存しました")).toBeVisible();
    await expect(page.getByText(merchantName)).toBeVisible();
  });

  test("Given ログイン済みユーザー, When 種別を「収入」に切り替えて金額と収入元を入力して記録する, Then 一覧にプラス表示で反映される", async ({
    page,
  }) => {
    // Given
    await page.goto("/entry");
    const incomeSource = `E2Eクライアント-${Date.now()}`;

    // When
    await page.getByRole("tab", { name: "収入" }).click();
    await expect(page.getByLabel("収入元(任意)")).toBeVisible();
    await page.getByLabel("金額").fill("100000");
    await page.getByLabel("収入元(任意)").fill(incomeSource);
    await page.getByRole("button", { name: "記録する" }).click();

    // Then
    await expect(page.getByText("保存しました")).toBeVisible();
    const row = page.locator("li", { hasText: incomeSource });
    await expect(row).toBeVisible();
    await expect(row.getByText("+100,000 JPY")).toBeVisible();
  });

  test("Given ログイン済みユーザー, When テンキーで金額を入力して記録する, Then 入力した金額で一覧に反映される", async ({
    page,
  }) => {
    // Given
    await page.goto("/entry");
    const merchantName = `E2Eテンキー-${Date.now()}`;

    // When: テンキーの「1」「2」「3」をタップして金額欄に「123」を組み立てる
    await page.getByRole("button", { name: "1", exact: true }).click();
    await page.getByRole("button", { name: "2", exact: true }).click();
    await page.getByRole("button", { name: "3", exact: true }).click();
    await expect(page.getByLabel("金額")).toHaveValue("123");
    await page.getByLabel("店名(任意)").fill(merchantName);
    await page.getByRole("button", { name: "記録する" }).click();

    // Then
    await expect(page.getByText("保存しました")).toBeVisible();
    const row = page.locator("li", { hasText: merchantName });
    await expect(row.getByText("-123 JPY")).toBeVisible();
  });
});
