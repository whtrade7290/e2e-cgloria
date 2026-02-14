import { defineConfig, devices } from 'playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173/';

export default defineConfig({
  // 루트에 있는 기존 테스트 파일(example.spec.ts)을 그대로 돌리기 위해 최상위 디렉터리를 테스트 경로로 둡니다.
  testDir: './src/tests',
  use: {
    // `page.goto('/')` 같이 상대 경로를 기본 URL 기준으로 처리합니다. 환경 변수로 덮어쓸 수 있습니다.
    baseURL: BASE_URL,
    headless: true,
    testIdAttribute: 'data-test-id',
  },
  webServer: {
    command: 'cd .. && npm run dev -- --host 127.0.0.1 --port 5173',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    // 주요 데스크톱 브라우저를 대상으로 돌립니다. 필요 없는 항목은 삭제해도 됩니다.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
