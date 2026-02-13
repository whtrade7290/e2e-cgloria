import { expect, test } from 'playwright/test';
import { Navbar } from '@pages/navbar.page';
import { Login } from '@pages/login.page';
import { SweetAlertPopup } from '@pages/sweetAlert.page';
import { BoardPage } from '@pages/board.page';
import { createFakeApiServer } from '../utils/fakeApiServer';

let fakeApiServer: ReturnType<typeof createFakeApiServer>;

const loginAsMember = async (page) => {
  const login = new Login(page);
  await page.goto('/login');
  await login.usernameInput.fill('member');
  await login.passwordInput.fill('password1!');
  await login.getButtonByName('로그인').click();
  const alert = new SweetAlertPopup(page);
  await alert.waitForVisible();
  await alert.expectTitle('로그인 되었습니다.');
  await alert.clickButton('OK');
  await alert.waitForHidden();
};

const openGeneralDetail = async (page) => {
  const boardPage = new BoardPage(page, '/general_forum');
  await boardPage.goto();
  await boardPage.openFirstRow();
};

test.beforeEach(async ({ page }) => {
  page.on('request', (request) => {
    if (request.url().includes('/comment/')) {
      console.log('[request]', request.method(), request.url());
    }
  });
  fakeApiServer = createFakeApiServer();
  fakeApiServer.resetComments('general_forum', 1);
  await fakeApiServer.setup(page);
  await page.goto('/');
  const navbar = new Navbar(page);
  await navbar.switchToKorean();
});

test('상세페이지 댓글 작성 (No.52)', async ({ page }) => {
  await loginAsMember(page);
  await openGeneralDetail(page);
  const commentInput = page.locator('.comment-textarea-box textarea');
  const newComment = `자동 댓글 ${Date.now()}`;
  await commentInput.fill(newComment);
  const writeResponsePromise = page.waitForResponse('**/comment/comment_write');
  const refreshResponse = page.waitForResponse('**/comment/comment');
  await page.locator('.comment-textarea-box button', { hasText: '작성' }).click();
  const writeResponse = await writeResponsePromise;
  console.log('write status', writeResponse.status());
  console.log('write body', await writeResponse.json());
  await refreshResponse;

  await expect
    .poll(async () => page.locator('.comment-display-box').count(), { timeout: 8000 })
    .toBeGreaterThan(0);
  const latestComment = page.locator('.comment-display-box').first();
  await expect(latestComment).toContainText(newComment);
  await expect(page.locator('.comment-writer-name').first()).toContainText('일반 유저');
});

test('상세페이지 댓글 수정 (No.53)', async ({ page }) => {
  fakeApiServer.addCommentEntry('general_forum', 1, {
    content: '원본 댓글',
    writer: 'member',
    writer_name: '일반 유저',
  });
  await loginAsMember(page);
  await openGeneralDetail(page);

  await page.locator('.edit-icon').first().click();
  const editTextarea = page.locator('.comment-edit-box textarea');
  const updated = `수정된 댓글 ${Date.now()}`;
  await editTextarea.fill(updated);
  const editResponse = page.waitForResponse('**/comment/comment_edit');
  await page.getByRole('button', { name: '확인' }).click();

  const modal = new SweetAlertPopup(page);
  await modal.waitForVisible();
  await modal.expectTitle('이 댓글을 수정하시겠습니까?');
  await modal.clickButton('확인');
  await editResponse;
  await modal.waitForVisible();
  await modal.expectTitle('댓글을 수정했습니다.');
  const refreshResponse = page.waitForResponse('**/comment/comment');
  await modal.clickButton('OK');
  await refreshResponse;
  await modal.waitForHidden();

  await expect(page.locator('.comment-display-box').first()).toContainText(updated);
});

test('상세페이지 댓글 삭제 (No.54)', async ({ page }) => {
  fakeApiServer.addCommentEntry('general_forum', 1, {
    content: '삭제 대상 댓글',
    writer: 'member',
    writer_name: '일반 유저',
  });
  await loginAsMember(page);
  await openGeneralDetail(page);

  await page.locator('.delete-icon').first().click();
  const modal = new SweetAlertPopup(page);
  await modal.waitForVisible();
  await modal.expectTitle('이 댓글을 삭제하시겠습니까?');
  const deleteResponse = page.waitForResponse('**/comment/comment_delete');
  await modal.clickButton('확인');
  await deleteResponse;
  await modal.waitForVisible();
  await modal.expectTitle('댓글을 삭제했습니다.');
  const refreshResponse = page.waitForResponse('**/comment/comment');
  await modal.clickButton('OK');
  await refreshResponse;
  await modal.waitForHidden();

  await expect(page.locator('.comment-display-box')).toHaveCount(0);
});
