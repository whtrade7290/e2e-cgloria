import { expect, test } from 'playwright/test';
import type { Page } from 'playwright/test';
import { Navbar } from '@pages/navbar.page';
import { Login } from '@pages/login.page';
import { SweetAlertPopup } from '@pages/sweetAlert.page';
import { createFakeApiServer } from '../utils/fakeApiServer';

declare global {
  interface Window {
    __downloadedFiles?: Array<{ url: string }>;
  }
}

let fakeApiServer: ReturnType<typeof createFakeApiServer>;

const loginAs = async (page: Page, username = 'member', password = 'password1!') => {
  const login = new Login(page);
  await page.goto('/login');
  await login.usernameInput.waitFor({ state: 'visible' });
  await login.usernameInput.fill(username);
  await login.passwordInput.fill(password);
  await login.getButtonByName('로그인').click();

  const loginAlert = new SweetAlertPopup(page);
  await loginAlert.waitForVisible();
  await loginAlert.expectTitle('로그인 되었습니다.');
  await loginAlert.clickButton('OK');
  await loginAlert.waitForHidden();
};

const getInputByLabel = (page: Page, labelText: string) =>
  page.locator(`xpath=//label[contains(normalize-space(),"${labelText}")]/following-sibling::input[1]`);

const navigateToProfile = async (page: Page) => {
  const navbar = new Navbar(page);
  await navbar.myPageToggle().click();
  await page.locator('.user-menu-dropdown .dropdown-item', { hasText: '내 정보 수정' }).click();
  await expect(page).toHaveURL(/\/profile/);
};

test.beforeEach(async ({ page }) => {
  fakeApiServer = createFakeApiServer();
  await fakeApiServer.setup(page);
  await page.goto('/');
  const navbar = new Navbar(page);
  await navbar.switchToKorean();
});

test('비로그인 상단 버튼 표시 (No.27)', async ({ page }) => {
  await page.goto('/');
  const loginButton = page.locator('.btn-unlogin', { hasText: '로그인' });
  const langButton = page.locator('.btn-unlogin', { hasText: '日本語' });
  await expect(loginButton).toBeVisible();
  await expect(langButton).toBeVisible();
  await expect(page.locator('.user-menu-wrapper')).toHaveCount(0);
});

test('로그인 상태 상단 버튼 표시 (No.28)', async ({ page }) => {
  await loginAs(page);
  await page.goto('/');
  const navbar = new Navbar(page);
  await expect(navbar.userGreeting()).toContainText('일반 유저 님');
  await navbar.myPageToggle().click();
  await expect(page.locator('.user-menu-dropdown .dropdown-item', { hasText: '내 정보 수정' })).toBeVisible();
  await expect(page.locator('.user-menu-dropdown .dropdown-item', { hasText: '로그아웃' })).toBeVisible();
  await expect(page.locator('.user-menu-dropdown .dropdown-item', { hasText: '日本語' })).toBeVisible();
});

test('한/일 언어 전환 시 안내와 내용이 변경된다 (No.29)', async ({ page }) => {
  const navbar = new Navbar(page);
  await navbar.switchToJapanase();
  await expect(page.getByRole('link', { name: '中央栄光教会' })).toBeVisible();
  await navbar.switchToKorean();
  await expect(page.getByRole('link', { name: '중앙영광교회' })).toBeVisible();
});

test('로그아웃 시 메인 화면으로 돌아간다 (No.30)', async ({ page }) => {
  const navbar = new Navbar(page);
  await loginAs(page);
  await navbar.logoutThroughMenu();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.nav-btn-container')).toContainText(/로그인|ログイン/);
});

test('내 정보 수정 화면을 열어 프로필을 확인할 수 있다 (No.31)', async ({ page }) => {
  await loginAs(page);
  await navigateToProfile(page);
  await expect(getInputByLabel(page, '아이디')).toHaveValue('member');
  await expect(getInputByLabel(page, '이름')).toBeVisible();
  await expect(getInputByLabel(page, '이메일')).toBeVisible();
});

test('내 정보 수정 초기화 버튼으로 변경 내용이 되돌아간다 (No.32)', async ({ page }) => {
  await loginAs(page);
  await navigateToProfile(page);

  const nameInput = getInputByLabel(page, '이름');
  const emailInput = getInputByLabel(page, '이메일');
  await expect(nameInput).not.toHaveValue('');
  await expect(emailInput).not.toHaveValue('');
  const originalName = await nameInput.inputValue();
  const originalEmail = await emailInput.inputValue();

  await nameInput.fill(`${originalName} 수정`);
  await emailInput.fill(`updated_${Date.now()}@example.com`);
  await page.getByRole('button', { name: '초기화' }).click();

  await expect(nameInput).toHaveValue(originalName);
  await expect(emailInput).toHaveValue(originalEmail);
});

test('메인 페이지 설교/금주의성경 섹션이 표시된다 (No.33)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('설교말씀', { exact: false })).toBeVisible();
  await expect(page.locator('#count-stats')).toBeVisible();
});

test('메인 페이지 칼럼/속회교재실/간증 섹션이 표시된다 (No.34)', async ({ page }) => {
  await expect(page.getByText('칼럼').first()).toBeVisible();
  await expect(page.getByText('속회교재실').first()).toBeVisible();
  await expect(page.getByText('간증').first()).toBeVisible();
});

test('제자훈련/주목자 예배/형제교회 바로가기 버튼이 있다 (No.35)', async ({ page }) => {
  await expect(page.locator('a[href="/training"]', { hasText: '바로가기' })).toBeVisible();
  await expect(page.locator('a[href="/jumok"]', { hasText: '바로가기' })).toBeVisible();
  await expect(page.locator('a[href="http://www.fujirefresh.com/"]', { hasText: '바로가기' })).toBeVisible();
});

test('상단 로고 클릭 시 메인으로 이동한다 (No.36)', async ({ page }) => {
  await page.goto('/notice');
  await page.getByRole('link', { name: '중앙영광교회' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('통독 일수를 비워두면 버튼이 비활성화된다 (No.37)', async ({ page }) => {
  await page.goto('/bible_plan');
  const daysInput = page.locator('#plan-days');
  await daysInput.fill('');
  const generateButton = page.getByRole('button', { name: '통독표 만들기' });
  await expect(generateButton).toBeDisabled();
});

test('통독 CSV를 생성하고 다운로드할 수 있다 (No.38)', async ({ page }) => {
  await page.addInitScript(() => {
    const originalCreateObjectURL = URL.createObjectURL.bind(URL);
    window.__downloadedFiles = [];
    URL.createObjectURL = new Proxy(originalCreateObjectURL, {
      apply(target, thisArg, args) {
        const url = Reflect.apply(target, thisArg, args);
        if (window.__downloadedFiles) {
          window.__downloadedFiles.push({ url });
        }
        return url;
      },
    });
  });
  await page.goto('/bible_plan');
  const daysInput = page.locator('#plan-days');
  await daysInput.fill('30');
  await page.getByRole('button', { name: '통독표 만들기' }).click();
  await expect(page.locator('.status-text.success')).toContainText('30일 통독표가 준비되었습니다.');
  const downloadButton = page.getByRole('button', { name: 'CSV 다운로드' });
  await expect(downloadButton).toBeEnabled();
  await downloadButton.click();
  await expect
    .poll(() => page.evaluate(() => window.__downloadedFiles?.length ?? 0))
    .toBeGreaterThan(0);
});
