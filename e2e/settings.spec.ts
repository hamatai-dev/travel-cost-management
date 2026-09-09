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

  test("Given カテゴリ管理ページ(支出タブ)を開く, When 新しいカテゴリを追加して削除する, Then 一覧に反映される", async ({
    page,
  }) => {
    // カテゴリ名は20文字以内という制約があるため、短い形式で一意な名前を作る
    const categoryName = `E2E-${Date.now() % 1000000}`;

    // Given: デフォルトカテゴリの読み込み(ユーザー確認の非同期処理)が終わるまで待つ。
    // 支出タブが既定で開く。
    await page.goto("/settings/categories");
    await expect(page.getByText("食費")).toBeVisible();
    // カテゴリの行に「デフォルト」バッジは出さない(共有カテゴリの解説文はページ下部に別途あるので対象外)
    await expect(page.locator("li", { hasText: "食費" }).getByText("デフォルト")).toHaveCount(0);

    // When: 追加(タブが種別を表すため、追加フォームに種別セレクトはない)
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

    // When: 削除(アプリ共通の確認ダイアログで警告文が出て、確定すると削除される)
    await page.locator("li", { hasText: categoryName }).getByRole("button").last().click();
    await expect(page.getByText("未分類」になります")).toBeVisible();
    await page.getByRole("button", { name: "削除する" }).click();

    // Then
    await expect(page.getByText("削除しました")).toBeVisible();
    await expect(page.getByText(categoryName)).not.toBeVisible();
  });

  test("Given カテゴリ管理ページで収入タブに切り替える, When カテゴリを追加する, Then 収入タブの一覧に反映され固定費チェックは表示されない", async ({
    page,
  }) => {
    // カテゴリ名は20文字以内という制約があるため、短い形式で一意な名前を作る
    const categoryName = `E2E収入-${Date.now() % 1000000}`;

    // Given
    await page.goto("/settings/categories");
    await expect(page.getByText("食費")).toBeVisible();
    await page.getByRole("tab", { name: "収入" }).click();

    // When
    await page.getByPlaceholder("例: フリーランス収入").fill(categoryName);
    await page.getByRole("button", { name: "追加" }).click();

    // Then
    await expect(page.getByText("追加しました")).toBeVisible();
    const row = page.locator("li", { hasText: categoryName });
    await expect(row).toBeVisible();
    // 収入カテゴリには固定費チェックが表示されない
    await expect(row.getByRole("checkbox")).toHaveCount(0);
  });

  test("Given デフォルトカテゴリには削除ボタンがある, When 非表示にしてから表示に戻す, Then 一覧から消え、再表示すると戻ってくる", async ({
    page,
  }) => {
    // Given: デフォルトカテゴリは共有マスタなので実削除はできないが、
    // 自分の一覧からの非表示(削除ボタンから操作できる)は必ずあるはず
    await page.goto("/settings/categories");
    await expect(page.getByText("食費")).toBeVisible();
    const row = page.locator("li", { hasText: "日用品" });
    await expect(row).toBeVisible();

    // When: 削除ボタン(デフォルトカテゴリでは「非表示にする」として振る舞う)を押す
    await row.getByRole("button").last().click();
    await expect(page.getByText("一覧から隠しますか")).toBeVisible();
    await page.getByRole("button", { name: "非表示にする" }).click();

    // Then: 通常の一覧(1つ目のul)からは消え、「非表示にしたカテゴリ」セクションに現れる
    await expect(page.getByText("一覧から非表示にしました")).toBeVisible();
    await expect(page.locator("ul").first().getByText("日用品")).toHaveCount(0);
    await expect(page.getByText("非表示にしたカテゴリ")).toBeVisible();

    // When: 表示に戻す
    await page
      .locator("li", { hasText: "日用品" })
      .getByRole("button", { name: "表示に戻す" })
      .click();

    // Then: 通常の一覧に戻る
    await expect(page.getByText("再表示しました")).toBeVisible();
    await expect(page.locator("ul").first().getByText("日用品")).toBeVisible();
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

  test("Given ヘッダーが常時表示される, When テーマをライトに切り替える, Then ダークモードのクラスが外れ再読み込み後も維持される", async ({
    page,
  }) => {
    // Given: デフォルトはダークモード。設定ページ自体にはもうテーマ切り替えはなく、
    // 常時表示のヘッダー側にある。
    await page.goto("/settings");
    await expect(page.locator("html")).toHaveClass(/dark/);

    // When
    await page.getByRole("button", { name: "ライト" }).click();

    // Then
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("Given 設定ページを開く, When マイページへ遷移して表示名を変更する, Then 保存され次回表示にも反映される", async ({
    page,
  }) => {
    const displayName = `E2Eユーザー${Date.now() % 1000000}`;

    // Given
    await page.goto("/settings");
    await page.getByRole("link", { name: "マイページ" }).click();
    await expect(page).toHaveURL(/\/mypage$/);
    await expect(page.getByLabel("メールアドレス")).toHaveValue(E2E_EMAIL!);

    // When
    await page.getByLabel("表示名").fill(displayName);
    await page.getByRole("button", { name: "表示名を保存する" }).click();

    // Then
    await expect(page.getByText("表示名を更新しました")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("表示名")).toHaveValue(displayName);
    // ヘッダーにも反映される
    await expect(page.getByRole("link", { name: displayName })).toBeVisible();
  });
});
