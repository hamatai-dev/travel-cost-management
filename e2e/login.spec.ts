import { expect, test } from "@playwright/test";

// メール送信を伴うOTPログイン成功パス自体は、Supabase無料枠のメール送信レート
// 制限により実行のたびに失敗しうるため対象外とする(外部サービス依存で不安定)。
// ここでは「未ログインなら守られたページに入れない」という決定的に検証できる
// 部分だけをE2Eの主要シナリオとして扱う。
test.describe("ログイン導線(主要シナリオ)", () => {
  test("Given 未ログイン状態で / にアクセスする, When ページが読み込まれる, Then /login にリダイレクトされる", async ({
    page,
  }) => {
    // Given / When
    await page.goto("/");

    // Then
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "支出管理アプリ ログイン" })).toBeVisible();
  });
});
