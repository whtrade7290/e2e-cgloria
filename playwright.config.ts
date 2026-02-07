import { defineConfig, devices } from 'playwright/test';

export default defineConfig({
  // 루트에 있는 기존 테스트 파일(example.spec.ts)을 그대로 돌리기 위해 최상위 디렉터리를 테스트 경로로 둡니다.
  testDir: './src/tests',
  use: {
    // `page.goto('/')` 같이 상대 경로를 기본 URL 기준으로 처리합니다. 환경 변수로 덮어쓸 수 있습니다.
    baseURL: 'http://localhost:5173/',
    headless: false,
    testIdAttribute: 'data-test-id',
  },
  projects: [
    // 주요 데스크톱 브라우저를 대상으로 돌립니다. 필요 없는 항목은 삭제해도 됩니다.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
