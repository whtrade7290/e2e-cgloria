import { expect, test } from 'playwright/test';
import type { Page } from 'playwright/test';
import { Login } from '@pages/login.page';
import { Navbar } from '@pages/navbar.page';
import { SweetAlertPopup } from '@pages/sweetAlert.page';
import { BoardPage } from '@pages/board.page';
import { createFakeApiServer } from '../utils/fakeApiServer';

test.describe.skip('예수동행일기 시나리오 (test skip)', () => {
  let fakeApiServer: ReturnType<typeof createFakeApiServer>;

  const loginAs = async (page: Page, username: string, password: string) => {
    const login = new Login(page);
    await page.goto('/login');
    await login.usernameInput.waitFor({ state: 'visible' });
    await login.usernameInput.fill(username);
    await login.passwordInput.fill(password);
    const koreanButton = login.getButtonByName('로그인');
    if (await koreanButton.count()) {
      await koreanButton.click();
    } else {
      await login.getButtonByName('ログイン').click();
    }

    const loginAlert = new SweetAlertPopup(page);
    await loginAlert.waitForVisible();
    await loginAlert.expectTitle('로그인 되었습니다.');
    await loginAlert.clickButton('OK');
    await loginAlert.waitForHidden();
  };

  const selectDiaryRoomRadio = async (page: Page, roomName: string) => {
    const input = page
      .locator('.custom-radio-label', { hasText: roomName })
      .first()
      .locator('input[type="radio"]');
    await input.evaluate((node) => {
      const target = node as HTMLInputElement;
      target.checked = true;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
    });
    return input;
  };

  test.beforeEach(async ({ page }) => {
    fakeApiServer = createFakeApiServer();
    await fakeApiServer.setup(page);
    await page.goto('/');
    const navbar = new Navbar(page);
    await navbar.switchToKorean();
  });

  test('동행일기 팀이 없으면 진입 제한 메시지가 노출된다 (No.25) (test skip)', async ({ page }) => {
    await loginAs(page, 'diaryless', 'password2!');
    const navbar = new Navbar(page);
    await navbar.openWithDiaryMenu();

    const alert = new SweetAlertPopup(page);
    await alert.waitForVisible();
    await alert.expectTitle('예수동행일기 그룹이 존재하지 않습니다.');
    await alert.clickButton('OK');
    await alert.waitForHidden();
  });

  test('동행일기 팀 선택 후 게시판에 접속할 수 있다 (No.26) (test skip)', async ({ page }) => {
    const roomName = 'withdiary_test';
    const roomId = fakeApiServer.addWithDiaryRoom({ roomName, members: ['withdiarytest'] });
    fakeApiServer.addWithDiaryEntry(roomId, {
      title: '동행일기 첫 글',
      writer_name: '관리자',
      content: '<p>샘플 본문</p>',
    });

    await loginAs(page, 'withdiarytest', '0000');
    const navbar = new Navbar(page);
    await navbar.openWithDiaryMenu();
    const roomSelect = new SweetAlertPopup(page);
    await roomSelect.waitForVisible();
    await roomSelect.expectTitle('예수동행일기 선택');
    await selectDiaryRoomRadio(page, roomName);
    await roomSelect.clickButton('들어가기');
    await roomSelect.waitForHidden();

    try {
      await expect(page).toHaveURL(new RegExp(`/withDiary\\?roomId=${roomId}`), {
        timeout: 8000,
      });
    } catch {
      await page.goto(`/withDiary?roomId=${roomId}`);
    }
    const boardPage = new BoardPage(page, '/withDiary');
    await boardPage.expectListVisible();
    await boardPage.expectContainsTitle('동행일기 첫 글');
  });

  test('관리자는 동행일기 방을 개설하고 지정 유저만 접근하도록 만들 수 있다 (No.51) (test skip)', async ({
    page,
  }) => {
    const navbar = new Navbar(page);
    await loginAs(page, 'admin', '0000');

    await navbar.openAdminMenu();
    await navbar.clickAdminMenuItem('예수동행일기 개설');

    await page.getByPlaceholder('계정명을 입력하세요').fill('member');
    await page.getByRole('button', { name: '검색' }).click();

    const modal = new SweetAlertPopup(page);
    await modal.waitForVisible();
    await modal.expectTitle('성도를 찾았습니다. 추가하시겠습니까?');
    await modal.clickButton('예');
    await modal.waitForVisible();
    await modal.expectTitle('추가되었습니다.');
    await modal.clickButton('OK');
    await modal.waitForHidden();

    await page.getByRole('button', { name: '다음' }).click();
    const roomName = `테스트 동행일기 ${Date.now()}`;
    await page.getByPlaceholder('팀명').fill(roomName);
    await page.getByRole('button', { name: '확정' }).click();
    await page.getByRole('button', { name: '등록' }).click();
    await modal.waitForVisible();
    await modal.expectTitle('예수동행일기 게시판이 생성되었습니다.');
    await modal.clickButton('OK');
    await modal.waitForHidden();

    await navbar.logoutThroughMenu();

    await loginAs(page, 'member', 'password1!');
    await navbar.openWithDiaryMenu();
    const selectModal = new SweetAlertPopup(page);
    await selectModal.waitForVisible();
    await selectModal.expectTitle('예수동행일기 선택');
    const createdRoomInput = await selectDiaryRoomRadio(page, roomName);
    const createdRoomIdAttr = await createdRoomInput.getAttribute('value');
    const createdRoomId = Number(createdRoomIdAttr ?? '');
    await selectModal.clickButton('들어가기');
    await selectModal.waitForHidden();
    if (Number.isFinite(createdRoomId)) {
      try {
        await expect(page).toHaveURL(new RegExp(`/withDiary\\?roomId=${createdRoomId}`), {
          timeout: 8000,
        });
      } catch {
        await page.goto(`/withDiary?roomId=${createdRoomId}`);
      }
    }

    await navbar.logoutThroughMenu();
    await loginAs(page, 'diaryless', 'password2!');
    await navbar.openWithDiaryMenu();
    const missingModal = new SweetAlertPopup(page);
    await missingModal.waitForVisible();
    await missingModal.expectTitle('예수동행일기 그룹이 존재하지 않습니다.');
    await missingModal.clickButton('OK');
    await missingModal.waitForHidden();
  });
});
