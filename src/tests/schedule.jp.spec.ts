import { expect, test } from 'playwright/test';
import { Buffer } from 'node:buffer';
import type { Page } from 'playwright/test';
import { Navbar } from '@pages/navbar.page';
import { Login } from '@pages/login.page';
import { SweetAlertPopup } from '@pages/sweetAlert.page';
import { EventSchedulePage } from '@pages/eventSchedule.page';
import { createFakeApiServer } from '../utils/fakeApiServer';

let fakeApiServer: ReturnType<typeof createFakeApiServer>;

const toDateInput = (date: Date) => date.toISOString().split('T')[0];

const loginAsAdminInJapanese = async (page: Page) => {
  const login = new Login(page);
  await page.goto('/login');
  await login.usernameInput.fill('admin');
  await login.passwordInput.fill('0000');
  await login.getButtonByName('ログイン').click();

  const loginAlert = new SweetAlertPopup(page);
  await loginAlert.waitForVisible();
  const alertMessage = await loginAlert.getTitleText();
  expect(['ログインできました。', '로그인 되었습니다.']).toContain(alertMessage);
  await loginAlert.clickButton('OK');
  await loginAlert.waitForHidden();
};

const gotoJapaneseScheduleAsAdmin = async (page: Page) => {
  const schedulePage = new EventSchedulePage(page);
  await schedulePage.goto();
  await schedulePage.expectAdminFormVisible(true);
  return schedulePage;
};

test.beforeEach(async ({ page }) => {
  fakeApiServer = createFakeApiServer();
  await fakeApiServer.setup(page);
  await page.goto('/');
  const navbar = new Navbar(page);
  await navbar.switchToJapanase();
  await loginAsAdminInJapanese(page);
});

test('[JP][CSV21] CSV一括登録の結果に成功件数が表示される', async ({ page }) => {
  const schedulePage = await gotoJapaneseScheduleAsAdmin(page);
  await schedulePage.clickCsvUploadButton();

  const uploadModal = new SweetAlertPopup(page);
  await uploadModal.waitForVisible();
  await uploadModal.expectTitle('CSV一括登録');

  const csvTitle = `JP CSV ${Date.now()}`;
  const today = new Date();
  const csvDate = toDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const csvContent = `title,start,end,color\n${csvTitle},${csvDate},${csvDate},#4988C4\n`;

  await page.setInputFiles('#csv-input', {
    name: 'jp_batch.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvContent, 'utf-8'),
  });
  await uploadModal.clickButton('CSV一括登録');
  await uploadModal.expectTitle('アップロード結果');

  const resultBox = page.locator('#swal2-html-container');
  await expect(resultBox).toContainText('成功: 1');
  await expect(resultBox).toContainText('失敗: 0');
  await uploadModal.clickButton('OK');
  await uploadModal.waitForHidden();

  await schedulePage.expectEventVisible(csvTitle);
});

test('[JP][CSV22] スケジュールを編集すると更新内容が表示される', async ({ page }) => {
  const today = new Date();
  const start = toDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
  const scheduleTitle = `JP 編集 ${Date.now()}`;
  fakeApiServer.addScheduleEntry({
    title: scheduleTitle,
    start,
    end: start,
    color: '#1C4D8D',
    userId: 1,
  });

  const schedulePage = await gotoJapaneseScheduleAsAdmin(page);
  await schedulePage.expectEventVisible(scheduleTitle);
  await schedulePage.openEvent(scheduleTitle);

  const detailModal = new SweetAlertPopup(page);
  await detailModal.waitForVisible();
  await detailModal.expectTitle(scheduleTitle);
  await detailModal.clickButton('編集');
  await detailModal.expectTitle('スケジュール編集');

  const updatedTitle = `${scheduleTitle} - 更新`;
  const updatedDate = toDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2));
  await page.fill('#edit-title', updatedTitle);
  await page.fill('#edit-start', updatedDate);
  await page.fill('#edit-end', updatedDate);
  await detailModal.clickButton('保存');
  await detailModal.expectTitle('スケジュールが更新されました。');
  await detailModal.clickButton('OK');
  await detailModal.waitForHidden();

  await schedulePage.expectEventVisible(updatedTitle);
});

test('[JP][CSV23] スケジュールを削除するとカレンダーから消える', async ({ page }) => {
  const today = new Date();
  const start = toDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3));
  const scheduleTitle = `JP 削除 ${Date.now()}`;
  fakeApiServer.addScheduleEntry({
    title: scheduleTitle,
    start,
    end: start,
    color: '#FD8A6B',
    userId: 1,
  });

  const schedulePage = await gotoJapaneseScheduleAsAdmin(page);
  await schedulePage.expectEventVisible(scheduleTitle);
  await schedulePage.openEvent(scheduleTitle);

  const deleteModal = new SweetAlertPopup(page);
  await deleteModal.waitForVisible();
  await deleteModal.expectTitle(scheduleTitle);
  await deleteModal.clickButton('削除');
  await deleteModal.expectTitle('本当に削除しますか？');
  await deleteModal.clickButton('削除');
  await deleteModal.expectTitle('スケジュールを削除しました。');
  await deleteModal.clickButton('OK');
  await deleteModal.waitForHidden();

  await schedulePage.expectEventNotVisible(scheduleTitle);
});
