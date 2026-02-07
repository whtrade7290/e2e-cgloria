# e2e-cgloria (Playwright E2E)

Playwright ベースの E2E テストプロジェクトです。`vue-cgloria-www` フロントエンドを対象に、CSV シナリオ（ケース 5〜14）を自動化しています。

## 構成

- `src/tests/`: Playwright テストスイート
  - `auth.spec.ts`: 会員登録 / ログイン系（ケース 1〜4）
  - `board.spec.ts`: 一般掲示板 / 写真掲示板（ケース 5〜14）
- `src/pages/`: Page Object 定義
  - `login.page.ts`, `navbar.page.ts`, `signup.page.ts`, `sweetAlert.page.ts`
  - `board.page.ts`, `photoBoard.page.ts`, `write.page.ts`, `edit.page.ts`
- `src/utils/fakeApiServer.ts`: Playwright MCP モックサーバー（掲示板 CRUD / 写真掲示板サポート）

## セットアップ

```bash
pnpm install
# または npm / yarn 等、ご利用環境に合わせて
```

## 実行方法

デフォルトの headless = false でブラウザが表示される仕様です。自動実行時は `PWTEST_HEADLESS=true` を付与してください。

```bash
PWTEST_HEADLESS=true npx playwright test src/tests/board.spec.ts
```

- 特定テストのみ実行: `--grep 'キーワード'`
- MCP サーバー起動: `npm run mcp`（別ターミナルで）

## メモ

- `TODO.md` に作業メモ（進行中／次のタスク／直近テストコマンドなど）を記録しています。
- 将来的に実バックエンドへ切り替える際は、`src/utils/fakeApiServer.ts` を Feature Flag などで制御する予定です。
