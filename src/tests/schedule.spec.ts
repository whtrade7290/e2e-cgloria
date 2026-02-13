import { expect, test } from 'playwright/test';
import type { Page } from 'playwright/test';
import { Buffer } from 'node:buffer';
import { Navbar } from '@pages/navbar.page';
import { Login } from '@pages/login.page';
import { SweetAlertPopup } from '@pages/sweetAlert.page';
import { EventSchedulePage } from '@pages/eventSchedule.page';
import { createFakeApiServer } from '../utils/fakeApiServer';

let fakeApiServer: ReturnType<typeof createFakeApiServer>;

const formatDateInput = (date: Date) => date.toISOString().split('T')[0];
const loginAs = async (page: Page, username: string, password: string) => {
  const login = new Login(page);
  await page.goto('/login');
  await login.usernameInput.fill(username);
  await login.passwordInput.fill(password);
  await login.getButtonByName('로그인').click();

  const loginAlert = new SweetAlertPopup(page);
  await loginAlert.waitForVisible();
  await loginAlert.expectTitle('로그인 되었습니다.');
  await loginAlert.clickButton('OK');
  await loginAlert.waitForHidden();
};

const gotoScheduleAsAdmin = async (page: Page) => {
  await loginAs(page, 'admin', '0000');
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
  await navbar.switchToKorean();
});

test('행사 일정은 비관리자에게 캘린더와 네비게이션만 노출된다', async ({ page }) => {
  const schedulePage = new EventSchedulePage(page);
  await schedulePage.goto();

  await schedulePage.expectCalendarVisible();
  await schedulePage.expectEventCountAtLeast(1);
  await schedulePage.expectAdminFormVisible(false);

  const initialMonth = await schedulePage.getCurrentMonthLabel();
  await schedulePage.goToNextMonth();
  await schedulePage.expectMonthLabelNotToBe(initialMonth);
  await schedulePage.goToPreviousMonth();
  await schedulePage.expectCurrentMonthLabel(initialMonth);
  await schedulePage.goToNextMonth();
  await schedulePage.goToToday();
  await schedulePage.expectCurrentMonthLabel(initialMonth);
});

test('관리자 유저는 행사 일정을 등록할 수 있다', async ({ page }) => {
  const schedulePage = await gotoScheduleAsAdmin(page);

  const title = `자동화 행사 ${Date.now()}`;
  const today = new Date();
  const startDate = formatDateInput(
    new Date(today.getFullYear(), today.getMonth(), Math.min(today.getDate(), 25)),
  );

  await schedulePage.fillTitle(title);
  await schedulePage.fillStartDate(startDate);
  await schedulePage.fillEndDate(startDate);
  await schedulePage.selectColor(0);
  await schedulePage.clickRegisterButton();

  const modal = new SweetAlertPopup(page);
  await modal.waitForVisible();
  await modal.expectTitle('입력 내용 확인');
  await modal.clickButton('확인');
  await modal.expectTitle('이벤트가 등록되었습니다.');
  await modal.clickButton('OK');
  await modal.waitForHidden();

  await schedulePage.expectEventVisible(title);
});

test('관리자는 행사 일정 CSV 샘플을 다운로드할 수 있다', async ({ page }) => {
  const schedulePage = await gotoScheduleAsAdmin(page);

  const downloadPromise = page.waitForEvent('download');
  await schedulePage.clickSampleDownloadButton();
  const download = await downloadPromise;

  await expect(download.suggestedFilename()).toBe('schedule_sample.csv');
});

test('관리자는 행사 일정 CSV를 일괄 업로드할 수 있다', async ({ page }) => {
  const schedulePage = await gotoScheduleAsAdmin(page);

  await schedulePage.clickCsvUploadButton();
  const modal = new SweetAlertPopup(page);
  await modal.waitForVisible();
  await modal.expectTitle('CSV 일괄등록');

  const csvTitle = `CSV 일정 ${Date.now()}`;
  const today = new Date();
  const csvDate = formatDateInput(
    new Date(today.getFullYear(), today.getMonth(), Math.min(today.getDate() + 2, 25)),
  );
  const csvContent = `title,start,end,color\n${csvTitle},${csvDate},${csvDate},#4988C4\n`;

  await page.setInputFiles('#csv-input', {
    name: 'batch.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvContent, 'utf-8'),
  });
  await modal.clickButton('CSV 일괄등록');
  await modal.expectTitle('업로드 결과');
  const resultBox = page.locator('#swal2-html-container');
  await expect(resultBox).toContainText('성공: 1');
  await expect(resultBox).toContainText('실패: 0');
  await modal.clickButton('OK');
  await modal.waitForHidden();

  await schedulePage.expectEventVisible(csvTitle);
});

test('관리자는 등록된 일정을 수정할 수 있다', async ({ page }) => {
  const today = new Date();
  const startDate = formatDateInput(
    new Date(today.getFullYear(), today.getMonth(), Math.min(today.getDate(), 20)),
  );
  const originalTitle = `수정 일정 ${Date.now()}`;
  fakeApiServer.addScheduleEntry({
    title: originalTitle,
    start: startDate,
    end: startDate,
    color: '#1C4D8D',
    userId: 1,
  });

  const schedulePage = await gotoScheduleAsAdmin(page);
  await schedulePage.expectEventVisible(originalTitle);
  await schedulePage.openEvent(originalTitle);

  const modal = new SweetAlertPopup(page);
  await modal.waitForVisible();
  await modal.expectTitle(originalTitle);
  await modal.clickButton('수정');
  await modal.expectTitle('스케줄 수정');
  const updatedTitle = `${originalTitle} - 업데이트`;
  const updatedDate = formatDateInput(
    new Date(today.getFullYear(), today.getMonth(), Math.min(today.getDate() + 1, 27)),
  );
  await page.fill('#edit-title', updatedTitle);
  await page.fill('#edit-start', updatedDate);
  await page.fill('#edit-end', updatedDate);
  await modal.clickButton('저장');
  await modal.expectTitle('스케줄이 수정되었습니다.');
  await modal.clickButton('OK');
  await modal.waitForHidden();

  await schedulePage.expectEventVisible(updatedTitle);
});

test('관리자는 일정을 삭제할 수 있다', async ({ page }) => {
  const today = new Date();
  const startDate = formatDateInput(
    new Date(today.getFullYear(), today.getMonth(), Math.min(today.getDate() + 3, 28)),
  );
  const title = `삭제 일정 ${Date.now()}`;
  fakeApiServer.addScheduleEntry({
    title,
    start: startDate,
    end: startDate,
    color: '#FD8A6B',
    userId: 1,
  });

  const schedulePage = await gotoScheduleAsAdmin(page);
  await schedulePage.expectEventVisible(title);
  await schedulePage.openEvent(title);

  const modal = new SweetAlertPopup(page);
  await modal.waitForVisible();
  await modal.expectTitle(title);
  await modal.clickButton('삭제');
  await modal.expectTitle('정말 삭제하시겠습니까?');
  await modal.clickButton('삭제');
  await modal.expectTitle('스케줄이 삭제되었습니다.');
  await modal.clickButton('OK');
  await modal.waitForHidden();

  await schedulePage.expectEventNotVisible(title);
});
