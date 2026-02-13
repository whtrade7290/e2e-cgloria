import { expect, test } from 'playwright/test';
import type { Page } from 'playwright/test';
import { Navbar } from '@pages/navbar.page';
import { Login } from '@pages/login.page';
import { SweetAlertPopup } from '@pages/sweetAlert.page';
import { createFakeApiServer } from '../utils/fakeApiServer';

let fakeApiServer: ReturnType<typeof createFakeApiServer>;

const loginAsAdmin = async (page: Page) => {
  const login = new Login(page);
  await page.goto('/login');
  await login.usernameInput.fill('admin');
  await login.passwordInput.fill('0000');
  await login.getButtonByName('로그인').click();

  const loginAlert = new SweetAlertPopup(page);
  await loginAlert.waitForVisible();
  await loginAlert.expectTitle('로그인 되었습니다.');
  await loginAlert.clickButton('OK');
  await loginAlert.waitForHidden();
};

test.beforeEach(async ({ page }) => {
  fakeApiServer = createFakeApiServer();
  await fakeApiServer.setup(page);
  await page.goto('/');
  const navbar = new Navbar(page);
  await navbar.switchToKorean();
});

test('미승인 유저 승인 (No.46)', async ({ page }) => {
  await loginAsAdmin(page);
  const navbar = new Navbar(page);
  await navbar.openAdminMenu();
  await navbar.clickAdminMenuItem('회원가입 승인');

  const pendingRow = page.locator('tbody tr').first();
  await expect(pendingRow).toContainText('pending_user');
  await pendingRow.getByRole('link', { name: '승인' }).click();
  const modal = new SweetAlertPopup(page);
  await modal.waitForVisible();
  await modal.expectTitle('회원가입을 승인하시겠습니까?');
  await modal.clickButton('확인');
  await modal.waitForVisible();
  await modal.expectTitle('승인되었습니다.');
  await modal.clickButton('OK');
  await modal.waitForHidden();
});
