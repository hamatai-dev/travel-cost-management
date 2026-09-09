import path from "node:path";
import { expect, test } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_TEST_EMAIL;
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD;

// CSVインポートの主要シナリオ。ログインが前提のため、cash-entry.spec.ts と
// 同じテスト専用アカウントを使う。未設定の環境ではスキップする。
test.describe("CSVインポート(主要シナリオ)", () => {
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

  test("Given 楽天カード形式のCSVを選択する, When プレビューを確認しインポートする, Then 取込結果が表示される", async ({
    page,
  }) => {
    // Given
    await page.goto("/import");
    const fixture = path.join(__dirname, "fixtures", "rakuten-sample.csv");

    // When: ファイル選択でプレビューが出る
    await page.locator("#csvFile").setInputFiles(fixture);

    // Then: 楽天カードの明細として認識され、内容がプレビューに出る
    await expect(page.getByText(/の明細として認識しました/)).toBeVisible();
    await expect(page.getByText("E2Eサンプル店舗")).toBeVisible();

    // When: インポートを実行する
    await page.getByRole("button", { name: "インポートする" }).click();

    // Then: 取込結果(重複していれば0件と表示されるが、成功メッセージ自体は出る)
    // 口座解決→バッチ作成→取込→バッチ更新と複数回Supabaseへ順次リクエストするため
    // 少し余裕を持たせる
    await expect(page.getByText(/件取り込みました/)).toBeVisible({ timeout: 15000 });
  });
});
