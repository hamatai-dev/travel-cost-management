This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## セットアップ

1. Supabaseプロジェクトを作成する
2. SQL Editorで [supabase/schema.sql](supabase/schema.sql) を実行する
3. `.env.local.example` を `.env.local` にコピーし、Project URLとPublishable(anon)キーを設定する

## テストの実行

```bash
pnpm test        # 単体テスト(Vitest, API/ビジネスロジック層)
pnpm test:watch  # 単体テストをwatchモードで実行
pnpm test:e2e    # E2Eテスト(Playwright, 主要シナリオのみ)
```

テスト方針は [CLAUDE.md](CLAUDE.md) を参照。

### E2Eテストの実行

`e2e/login.spec.ts` は認証なしで実行できるが、`e2e/cash-entry.spec.ts`
(ログインが前提の主要シナリオ)は専用のテストアカウントが必要で、未設定の場合は
自動的にスキップされる。有効にするには:

1. Supabaseダッシュボードの Authentication → Users で、実ユーザーとは別の
   テスト専用アカウントを email/password で作成する(例: `e2e-test@example.com`)
2. `.env.local` に以下を追加する

```
E2E_TEST_EMAIL=e2e-test@example.com
E2E_TEST_PASSWORD=<作成したパスワード>
```

`/api/e2e-login` はこのテストアカウントでセッションCookieを発行するための
テスト専用APIで、本番ビルド(`NODE_ENV=production`)では常に404を返す。

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
