import { expect, test } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_TEST_EMAIL;
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD;

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

  test("Given ログインページを開く, When 表示する, Then メール+パスワードのフォームとGoogleログインボタンが表示される", async ({
    page,
  }) => {
    // Given / When
    await page.goto("/login");

    // Then
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByLabel("パスワード")).toBeVisible();
    await expect(page.getByRole("button", { name: "ログイン", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Googleでログイン" })).toBeVisible();
  });

  test("Given 誤ったパスワードを入力する, When ログインを送信する, Then エラーメッセージが表示されログイン画面に留まる", async ({
    page,
  }) => {
    // Given
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill("wrong-user@example.com");
    await page.getByLabel("パスワード").fill("wrong-password");

    // When
    await page.getByRole("button", { name: "ログイン", exact: true }).click();

    // Then
    await expect(page.getByText("メールアドレスまたはパスワードが正しくありません")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("Given メールアドレスを入力せずパスワードリセットを求める, When 「パスワードをお忘れですか?」を押す, Then メールアドレス未入力のエラーが表示される(メール送信は行われない)", async ({
    page,
  }) => {
    // Given
    await page.goto("/login");

    // When
    await page.getByRole("button", { name: "パスワードをお忘れですか?" }).click();

    // Then
    await expect(page.getByText("メールアドレスを入力してください")).toBeVisible();
  });

  test("Given 未ログイン状態で /reset-password にアクセスする, When ページが読み込まれる, Then /login にリダイレクトされる", async ({
    page,
  }) => {
    // Given / When
    await page.goto("/reset-password");

    // Then: リカバリー用のセッションがない状態で直接開いても、保護ページとして/loginに弾かれる
    await expect(page).toHaveURL(/\/login$/);
  });

  test.describe("正しい認証情報でのログイン", () => {
    test.skip(
      !E2E_EMAIL || !E2E_PASSWORD,
      "E2E_TEST_EMAIL / E2E_TEST_PASSWORD が未設定のためスキップします。README.md参照。",
    );

    test("Given 正しいメールアドレスとパスワードを入力する, When ログインを送信する, Then ログイン後の画面に遷移する", async ({
      page,
    }) => {
      // Given
      await page.goto("/login");
      await page.getByLabel("メールアドレス").fill(E2E_EMAIL!);
      await page.getByLabel("パスワード").fill(E2E_PASSWORD!);

      // When
      await page.getByRole("button", { name: "ログイン", exact: true }).click();

      // Then
      await expect(page).not.toHaveURL(/\/login$/, { timeout: 10000 });
    });
  });
});
