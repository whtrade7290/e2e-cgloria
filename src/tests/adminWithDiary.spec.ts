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

const openMakeWithDiaryPage = async (page: Page) => {
  const navbar = new Navbar(page);
  await navbar.openAdminMenu();
  await navbar.clickAdminMenuItem('예수동행일기 개설');
};

const openManageWithDiaryPage = async (page: Page) => {
  const navbar = new Navbar(page);
  await navbar.openAdminMenu();
  await navbar.clickAdminMenuItem('예수동행일기 방 관리');
};

const createRoom = (roomName: string, members: string[]) => {
  const roomId = fakeApiServer.addWithDiaryRoom({ roomName, members });
  fakeApiServer.addWithDiaryEntry(roomId, {
    title: `${roomName} 첫 게시글`,
    writer_name: '관리자',
    content: `<p>${roomName} 내용</p>`,
  });
  return roomId;
};

const searchMember = async (page: Page, keyword = 'member') => {
  await page.getByPlaceholder('계정명을 입력하세요').fill(keyword);
  await page.getByRole('button', { name: '검색' }).click();
};

test.beforeEach(async ({ page }) => {
  fakeApiServer = createFakeApiServer();
  await fakeApiServer.setup(page);
  await page.goto('/');
  const navbar = new Navbar(page);
  await navbar.switchToKorean();
});

test('성도 검색 성공 시 다이얼로그가 표시된다 (No.39)', async ({ page }) => {
  await loginAsAdmin(page);
  await openMakeWithDiaryPage(page);

  await searchMember(page, 'member');
  const modal = new SweetAlertPopup(page);
  await modal.waitForVisible();
  await modal.expectTitle('성도를 찾았습니다. 추가하시겠습니까?');
  await modal.clickButton('예');
  await modal.waitForVisible();
  await modal.expectTitle('추가되었습니다.');
  await modal.clickButton('OK');
  await modal.waitForHidden();
});

test('성도 검색 미입력/미등록 시 경고가 표시된다 (No.40)', async ({ page }) => {
  await loginAsAdmin(page);
  await openMakeWithDiaryPage(page);

  await page.getByRole('button', { name: '검색' }).click();
  const warn = new SweetAlertPopup(page);
  await warn.waitForVisible();
  await warn.expectTitle('아이디를 입력해주세요.');
  await warn.clickButton('OK');
  await warn.waitForHidden();

  await searchMember(page, 'unknown-user');
  await warn.waitForVisible();
  await warn.expectTitle('성도를 찾을 수 없습니다');
  await warn.clickButton('OK');
  await warn.waitForHidden();
});

test('팀명을 입력하지 않으면 등록할 수 없다 (No.41)', async ({ page }) => {
  await loginAsAdmin(page);
  await openMakeWithDiaryPage(page);

  await searchMember(page, 'member');
  const modal = new SweetAlertPopup(page);
  await modal.waitForVisible();
  await modal.expectTitle('성도를 찾았습니다. 추가하시겠습니까?');
  await modal.clickButton('예');
  await modal.waitForVisible();
  await modal.expectTitle('추가되었습니다.');
  await modal.clickButton('OK');
  await modal.waitForHidden();

  await page.getByRole('button', { name: '다음' }).click();
  await page.getByRole('button', { name: '확정' }).click();
  await modal.waitForVisible();
  await modal.expectTitle('팀이름을 입력하여주세요.');
  await modal.clickButton('OK');
  await modal.waitForHidden();
});

test('팀명을 설정하면 예수동행일기 방이 생성된다 (No.42)', async ({ page }) => {
  await loginAsAdmin(page);
  await openMakeWithDiaryPage(page);

  await searchMember(page, 'member');
  const modal = new SweetAlertPopup(page);
  await modal.waitForVisible();
  await modal.expectTitle('성도를 찾았습니다. 추가하시겠습니까?');
  await modal.clickButton('예');
  await modal.waitForVisible();
  await modal.expectTitle('추가되었습니다.');
  await modal.clickButton('OK');
  await modal.waitForHidden();

  await page.getByRole('button', { name: '다음' }).click();
  const teamName = `자동화팀 ${Date.now()}`;
  await page.getByPlaceholder('팀명').fill(teamName);
  await page.getByRole('button', { name: '확정' }).click();
  await page.getByRole('button', { name: '등록' }).click();
  await modal.waitForVisible();
  await modal.expectTitle('예수동행일기 게시판이 생성되었습니다.');
  await modal.clickButton('OK');
  await modal.waitForHidden();
});

test('예수동행일기 방 관리 리스트가 표시된다 (No.43)', async ({ page }) => {
  createRoom('manage_room_1', ['member']);
  createRoom('manage_room_2', ['member', 'diaryless']);

  await loginAsAdmin(page);
  await openManageWithDiaryPage(page);
  await expect(page.locator('tbody')).toContainText('manage_room_1');
  await expect(page.locator('tbody')).toContainText('manage_room_2');
});

test('멤버 확인과 삭제 기능이 동작한다 (No.44)', async ({ page }) => {
  createRoom('member_room', ['member', 'diaryless']);
  await loginAsAdmin(page);
  await openManageWithDiaryPage(page);

  await page.getByRole('link', { name: '멤버 확인' }).first().click();
  const modal = new SweetAlertPopup(page);
  await modal.waitForVisible();
  await page.locator('.swal-remove-member-link').first().click();
  await expect
    .poll(async () => await modal.getTitleText(), { timeout: 8000 })
    .toContain('삭제하시겠습니까');
  await modal.clickButton('삭제');
  await modal.waitForVisible();
  await modal.expectTitle('구성원을 삭제했습니다.');
  await modal.clickButton('OK');
  await modal.waitForVisible();
  await modal.clickButton('확인');
  await modal.waitForHidden();
});

test('방을 삭제하면 리스트에서 사라진다 (No.45)', async ({ page }) => {
  createRoom('delete_room', ['member']);
  await loginAsAdmin(page);
  await openManageWithDiaryPage(page);

  await page.getByRole('link', { name: '방 삭제' }).first().click();
  const modal = new SweetAlertPopup(page);
  await modal.waitForVisible();
  await expect(await modal.getTitleText()).toContain('삭제하시겠습니까');
  await modal.clickButton('방 삭제');
  await modal.waitForVisible();
  await modal.expectTitle('방을 삭제했습니다.');
  await modal.clickButton('OK');
  await modal.waitForHidden();
});
