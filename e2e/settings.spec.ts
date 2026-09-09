import { expect, test } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_TEST_EMAIL;
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("設定(主要シナリオ)", () => {
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

  test("Given カテゴリ管理ページを開く, When 新しいカテゴリを追加して削除する, Then 一覧に反映される", async ({
    page,
  }) => {
    // カテゴリ名は20文字以内という制約があるため、短い形式で一意な名前を作る
    const categoryName = `E2E-${Date.now() % 1000000}`;

    // Given: デフォルトカテゴリの読み込み(ユーザー確認の非同期処理)が終わるまで待つ
    await page.goto("/settings/categories");
    await expect(page.getByText("食費")).toBeVisible();

    // When: 追加
    await page.getByPlaceholder("例: お土産").fill(categoryName);
    await page.getByRole("button", { name: "追加" }).click();
    await expect(page.getByText("追加しました")).toBeVisible();
    await expect(page.getByText(categoryName)).toBeVisible();

    // When: 固定費チェックを入れる(AWS・Netflixのような毎月固定の支払い用)
    // base-uiのCheckboxは見た目のspan(role=checkbox)とフォーム送信用の隠しinputの
    // 2つを持つため、role指定で見た目側だけを対象にする。
    const row = page.locator("li", { hasText: categoryName });
    await row.getByRole("checkbox").click();

    // Then: チェック状態が保持される(再読み込みしても消えない)
    await page.reload();
    await expect(
      page.locator("li", { hasText: categoryName }).getByRole("checkbox"),
    ).toBeChecked();

    // When: 削除(確認ダイアログをOKする)
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("li", { hasText: categoryName }).getByRole("button").last().click();

    // Then
    await expect(page.getByText("削除しました")).toBeVisible();
    await expect(page.getByText(categoryName)).not.toBeVisible();
  });

  test("Given カテゴリ管理ページを開く, When 種別「収入」でカテゴリを追加する, Then 収入バッジ付きで一覧に反映される", async ({
    page,
  }) => {
    // カテゴリ名は20文字以内という制約があるため、短い形式で一意な名前を作る
    const categoryName = `E2E収入-${Date.now() % 1000000}`;

    // Given
    await page.goto("/settings/categories");
    await expect(page.getByText("食費")).toBeVisible();

    // When
    await page.getByPlaceholder("例: お土産").fill(categoryName);
    const kindSelect = page.getByRole("combobox");
    await kindSelect.click();
    await page.getByRole("option", { name: "収入" }).click();
    await page.getByRole("button", { name: "追加" }).click();

    // Then
    await expect(page.getByText("追加しました")).toBeVisible();
    const row = page.locator("li", { hasText: categoryName });
    await expect(row.getByText("収入")).toBeVisible();
    // 収入カテゴリには固定費チェックが表示されない
    await expect(row.getByRole("checkbox")).toHaveCount(0);
  });

  test("Given インポート履歴ページを開く, When 表示する, Then 一覧または空状態のいずれかが表示される", async ({
    page,
  }) => {
    // Given / When
    await page.goto("/settings/imports");

    // Then
    await expect(page.getByRole("heading", { name: "インポート履歴" })).toBeVisible();
    await expect(
      page.getByText("誤って取り込んだ場合は取り消せます"),
    ).toBeVisible();
  });

  test("Given 支払い種別管理ページを開く, When 表示する, Then 一覧または空状態が表示される", async ({
    page,
  }) => {
    // Given / When
    await page.goto("/settings/accounts");

    // Then
    await expect(page.getByRole("heading", { name: "支払い種別管理" })).toBeVisible();
  });
});
