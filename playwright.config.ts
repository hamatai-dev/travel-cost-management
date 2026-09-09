import { defineConfig } from "@playwright/test";

// Next.js(next dev)は .env.local を自動で読むが、Playwrightのテストプロセス
// 自体はそうではないため、E2E_TEST_EMAIL 等をここで明示的に読み込む。
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local が無い環境(CI等)ではスキップされるだけでよい
}

// E2Eは「主要シナリオの補足確認」という位置づけのため、広範囲のブラウザ/デバイス
// マトリクスは組まず、Chromiumのみで最小限のハッピーパスを検証する。
export default defineConfig({
  testDir: "./e2e",
  // 同じSupabaseプロジェクト・同じテストアカウントに対して複数シナリオが
  // 同時にリクエストを送ると詰まって遅延・タイムアウトしやすいため、
  // 並列実行はせず直列に実行する(E2Eは補助的な位置づけなので実行時間より
  // 安定性を優先する)。
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3001",
  },
  webServer: {
    // Next.jsはプロジェクトディレクトリ単位でdevサーバーの多重起動を拒否するため、
    // 別ポートは使わずユーザーが起動済みのポートをそのまま再利用する
    // (reuseExistingServer: true により、既に立っていれば新規起動しない)。
    // ポート番号は他プロジェクトとの競合で変わることがあるため、その都度合わせる。
    command: "pnpm dev -p 3001",
    url: "http://localhost:3001",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
