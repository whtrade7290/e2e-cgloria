import { test, expect } from 'playwright/test';
import { Navbar } from '@pages/navbar.page';

test.beforeEach(async ({ page }) => {
  const navbar = new Navbar(page);
  await navbar.goToHome();
});

test('한국어 전환', async ({ page }) => {
  // Arrange
  const navbar = new Navbar(page);

  await navbar.switchToKorean();

  // 결과 검증(핵심 1~2개만)
  await expect(page.locator('.navbar-brand')).toHaveText('중앙영광교회');
  await expect(page.locator('.page-header .main-font')).toHaveText('중앙영광교회');
});

test('한국어 전환 후 일본어 전환', async ({ page }) => {
  // Arrange
  const navbar = new Navbar(page);

  await navbar.switchToKorean();
  await navbar.switchToJapanase();

  // 결과 검증(핵심 1~2개만)
  await expect(page.locator('.navbar-brand')).toHaveText('中央栄光教会');
  await expect(page.locator('.page-header .main-font')).toHaveText('中央栄光教会');
});

test('로그인 화면 이동', async ({ page }) => {
  // Arrange
  const navbar = new Navbar(page);

  // Act
  await navbar.clickLogin();
  const accountInput = page.getByPlaceholder('アカウント名を入力してください');
  const passwordInput = page.getByPlaceholder('パスワードを入力してください');

  // Assert
  await expect(accountInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
});

// test('로그인 성공', async ({ page }) => {
//   // Arrange
//   // Act
//   // Assert
// });
