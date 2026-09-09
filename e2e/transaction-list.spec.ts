import { expect, test } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_TEST_EMAIL;
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("取引一覧・編集(主要シナリオ)", () => {
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

  test("Given 現金支出を記録し同期済み, When 一覧から検索して編集する, Then 変更内容が保存され一覧に反映される", async ({
    page,
  }) => {
    const merchantName = `E2E一覧テスト-${Date.now()}`;

    // Given: 一覧に載せる取引を1件、現金入力で作っておく
    await page.goto("/entry");
    await page.getByLabel("金額").fill("321");
    await page.getByLabel("店名(任意)").fill(merchantName);
    await page.getByRole("button", { name: "記録する" }).click();
    await expect(page.getByText("保存しました")).toBeVisible();
    await page.waitForTimeout(3000); // オンライン自動同期を待つ

    // When: 一覧で検索してヒットさせ、編集ダイアログを開いてメモを保存する
    await page.goto("/");
    const searchBox = page.getByPlaceholder("店名・メモで検索");
    await searchBox.fill(merchantName);
    await searchBox.press("Enter");
    await expect(page.getByText(merchantName)).toBeVisible({ timeout: 10000 });

    await page.getByText(merchantName).click();
    await expect(page.getByRole("heading", { name: "取引を編集" })).toBeVisible();
    await page.getByLabel("メモ").fill("E2E編集テスト");
    await page.getByRole("button", { name: "保存する" }).click();

    // Then
    await expect(page.getByText("更新しました")).toBeVisible();
  });

  test("Given 取引一覧を開く, When 支払い種別フィルタで楽天カードを選ぶ, Then セレクトの表示がUUIDではなく名前になる", async ({
    page,
  }) => {
    // Given: 楽天カードの取引が存在する状態にする(CSVインポートで作られる)
    // combobox の並びは [0]種別 [1]支払い種別 [2]カテゴリ
    await page.goto("/");
    const accountSelect = page.getByRole("combobox").nth(1);

    // When
    await accountSelect.click();
    await page.getByRole("option", { name: "楽天カード" }).click();

    // Then: UUID(ハイフン区切りの16進数)ではなく名前が表示される
    await expect(accountSelect).toContainText("楽天カード");
    await expect(accountSelect).not.toHaveText(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  });
});
