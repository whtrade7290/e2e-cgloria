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

const openUserManagePage = async (page: Page) => {
  const navbar = new Navbar(page);
  await navbar.openAdminMenu();
  await navbar.clickAdminMenuItem('유저 관리');
};

const waitForApprovedUsersResponse = (page: Page) =>
  page.waitForResponse((response) => response.url().includes('/approvedUsers'));

test.beforeEach(async ({ page }) => {
  fakeApiServer = createFakeApiServer();
  await fakeApiServer.setup(page);
  await page.goto('/');
  const navbar = new Navbar(page);
  await navbar.switchToKorean();
});

test('승인된 유저 목록이 표시된다 (No.47)', async ({ page }) => {
  await loginAsAdmin(page);
  await openUserManagePage(page);
  await waitForApprovedUsersResponse(page);
  const table = page.locator('tbody');
  await expect(table).not.toContainText('검색 결과가 없습니다.');
});

test('유저 관리 페이지에서 페이지 이동이 가능하다 (No.48)', async ({ page }) => {
  await loginAsAdmin(page);
  await openUserManagePage(page);
  await waitForApprovedUsersResponse(page);
  const secondPageLink = page.locator('.pagination').getByRole('link', { name: '2' });
  await expect(secondPageLink).toBeVisible();
  const responsePromise = waitForApprovedUsersResponse(page);
  await secondPageLink.click();
  await responsePromise;
  await expect(page.locator('tbody')).toContainText('user21');
});

test('유저 관리 페이지에서 검색이 가능하다 (No.49)', async ({ page }) => {
  await loginAsAdmin(page);
  await openUserManagePage(page);
  await waitForApprovedUsersResponse(page);
  await page.locator('.search-container input').fill('user3');
  await page.getByRole('button', { name: '검색' }).click();
  await waitForApprovedUsersResponse(page);
  await expect(page.locator('tbody')).toContainText('user3');
});

test('유저를 사용 제한하면 목록에서 제거된다 (No.50)', async ({ page }) => {
  await loginAsAdmin(page);
  await openUserManagePage(page);
  await waitForApprovedUsersResponse(page);
  const targetRow = page.locator('tbody tr').first();
  await expect(targetRow).toBeVisible();
  const username = await targetRow.locator('td').nth(1).innerText();
  const refreshPromise = waitForApprovedUsersResponse(page);
  await targetRow.getByRole('link', { name: '사용 제한' }).click();
  const modal = new SweetAlertPopup(page);
  await modal.waitForVisible();
  await modal.expectTitle('해당 사용자를 제한하시겠습니까?');
  await modal.clickButton('확인');
  await modal.waitForVisible();
  await modal.expectTitle('사용자를 제한했습니다.');
  await modal.clickButton('OK');
  await modal.waitForHidden();
  await refreshPromise;
  await expect(page.locator('tbody')).not.toContainText(username);
});
