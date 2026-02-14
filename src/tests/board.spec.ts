import { test, expect } from 'playwright/test';
import { Buffer } from 'node:buffer';
import { Navbar } from '@pages/navbar.page';
import { Login } from '@pages/login.page';
import { SweetAlertPopup } from '@pages/sweetAlert.page';
import { BoardPage } from '@pages/board.page';
import { PhotoBoardPage } from '@pages/photoBoard.page';
import { WritePage } from '@pages/write.page';
import { EditPage } from '@pages/edit.page';
import { createFakeApiServer } from '../utils/fakeApiServer';

type BoardScenario = {
  path: string;
  displayName: string;
  sampleTitle: string;
  page2Title: string;
};

const BOARDS: BoardScenario[] = [
  {
    path: '/notice',
    displayName: '공지사항',
    sampleTitle: '공지사항 샘플 게시글 1',
    page2Title: '공지사항 샘플 게시글 21',
  },
  {
    path: '/sermon',
    displayName: '설교',
    sampleTitle: '설교 샘플 게시글 1',
    page2Title: '설교 샘플 게시글 21',
  },
  {
    path: '/column',
    displayName: '칼럼',
    sampleTitle: '칼럼 샘플 게시글 1',
    page2Title: '칼럼 샘플 게시글 21',
  },
  {
    path: '/weekly_bible_verse',
    displayName: '금주의성경말씀',
    sampleTitle: '금주의 성경 말씀 샘플 게시글 1',
    page2Title: '금주의 성경 말씀 샘플 게시글 21',
  },
  {
    path: '/class_meeting',
    displayName: '속회교재실',
    sampleTitle: '속회 교재실 샘플 게시글 1',
    page2Title: '속회 교재실 샘플 게시글 21',
  },
  {
    path: '/sunday_school_resource',
    displayName: '주일학교 자료실',
    sampleTitle: '주일학교 자료실 샘플 게시글 1',
    page2Title: '주일학교 자료실 샘플 게시글 21',
  },
  {
    path: '/general_forum',
    displayName: '자유게시판',
    sampleTitle: '자유게시판 샘플 게시글 1',
    page2Title: '자유게시판 샘플 게시글 21',
  },
  {
    path: '/testimony',
    displayName: '간증게시판',
    sampleTitle: '간증 게시판 샘플 게시글 1',
    page2Title: '간증 게시판 샘플 게시글 21',
  },
];

let fakeApiServer: ReturnType<typeof createFakeApiServer>;
const SEARCH_BOARD = BOARDS[0];
const PAGINATION_BOARD = BOARDS[0];
const DETAIL_BOARD = BOARDS[0];
const PHOTO_BOARDS: BoardScenario[] = [
  {
    path: '/photo_board',
    displayName: '사진갤러리',
    sampleTitle: '사진갤러리 샘플 게시글 1',
    page2Title: '사진갤러리 샘플 게시글 21',
  },
  {
    path: '/school_photo_board',
    displayName: '주일학교 사진갤러리',
    sampleTitle: '주일학교 사진갤러리 샘플 게시글 1',
    page2Title: '주일학교 사진갤러리 샘플 게시글 21',
  },
];
const PHOTO_SEARCH_BOARD = PHOTO_BOARDS[0];
const PHOTO_PAGINATION_BOARD = PHOTO_BOARDS[0];
const PHOTO_DETAIL_BOARD = PHOTO_BOARDS[0];
const PHOTO_WRITE_BOARD = PHOTO_BOARDS[0];
const SAMPLE_IMAGE_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lPqzWQAAAABJRU5ErkJggg==',
  'base64',
);

test.beforeEach(async ({ page }) => {
  fakeApiServer = createFakeApiServer();
  await fakeApiServer.setup(page);
  await page.goto('/');
  const navbar = new Navbar(page);
  await navbar.switchToKorean();
});

for (const board of BOARDS) {
  test(`비로그인 ${board.displayName} 게시판 기본 요소 노출`, async ({ page }) => {
    const boardPage = new BoardPage(page, board.path);
    await boardPage.goto();

    await boardPage.expectSideMenuVisible();
    await boardPage.expectContainsTitle(board.sampleTitle);
    await boardPage.expectSearchVisible();
    await boardPage.expectWriteButtonVisible(false);
  });

  test(`로그인 ${board.displayName} 게시판 기본 요소 노출`, async ({ page }) => {
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

    const boardPage = new BoardPage(page, board.path);
    await boardPage.goto();
    await boardPage.expectSideMenuVisible();
    await boardPage.expectContainsTitle(board.sampleTitle);
    await boardPage.expectSearchVisible();
    await boardPage.expectWriteButtonVisible(true);
  });
}

test(`게시판 검색 결과 확인 (${SEARCH_BOARD.displayName})`, async ({ page }) => {
  const boardPage = new BoardPage(page, SEARCH_BOARD.path);
  await boardPage.goto();

  await boardPage.search(SEARCH_BOARD.sampleTitle);
  await boardPage.expectContainsTitle(SEARCH_BOARD.sampleTitle);
  await boardPage.expectNotContainsTitle('검색 결과가 없습니다.');

  await boardPage.search('존재하지 않는 제목');
  await boardPage.expectNoResultsMessage();
});

test(`게시판 페이지 이동 확인 (${PAGINATION_BOARD.displayName})`, async ({ page }) => {
  const boardPage = new BoardPage(page, PAGINATION_BOARD.path);
  await boardPage.goto();

  await boardPage.expectContainsTitle(PAGINATION_BOARD.sampleTitle);
  await boardPage.expectNotContainsTitle(PAGINATION_BOARD.page2Title);

  await boardPage.goToPage(2);

  await boardPage.expectContainsTitle(PAGINATION_BOARD.page2Title);
  await boardPage.expectNotContainsTitle(PAGINATION_BOARD.sampleTitle);
});

test(`게시판 상세 -> 목록으로 버튼 확인 (${DETAIL_BOARD.displayName})`, async ({ page }) => {
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

  const boardPage = new BoardPage(page, DETAIL_BOARD.path);
  await boardPage.goto();
  await boardPage.openFirstRow();

  await expect(page).toHaveURL(new RegExp(`/detail/${DETAIL_BOARD.path.replace('/', '')}/\\d+`));
  await boardPage.expectDetailTitle(DETAIL_BOARD.sampleTitle);

  await boardPage.clickBackToList();
  await expect(page).toHaveURL(new RegExp(`${DETAIL_BOARD.path}(\\?.*)?$`));
  await boardPage.expectListVisible();
});

test('일반 유저 게시글 작성 시 최상단 노출 및 상세 확인', async ({ page }) => {
  const login = new Login(page);
  await page.goto('/login');
  await login.usernameInput.fill('member');
  await login.passwordInput.fill('password1!');
  await login.getButtonByName('로그인').click();

  const loginAlert = new SweetAlertPopup(page);
  await loginAlert.waitForVisible();
  await loginAlert.expectTitle('로그인 되었습니다.');
  await loginAlert.clickButton('OK');
  await loginAlert.waitForHidden();

  const boardPage = new BoardPage(page, '/general_forum');
  await boardPage.goto();
  await boardPage.expectWriteButtonVisible(true);
  await boardPage.clickWriteButton();

  const writePage = new WritePage(page);
  await writePage.expectMainContentToggleVisible(false);

  const title = `자동화 게시글 ${Date.now()}`;
  const content = `자동화 본문 ${Date.now()}`;
  await writePage.fillTitle(title);
  await writePage.fillContent(content);
  await writePage.submit();
  await expect(page).toHaveURL(/\/general_forum$/);
  const refreshedBoardPage = new BoardPage(page, '/general_forum');
  await refreshedBoardPage.expectFirstRowTitle(title);
  await refreshedBoardPage.expectFirstRowWriter('일반 유저');
  await refreshedBoardPage.expectFirstRowDateContains(new Date().getFullYear().toString());

  await refreshedBoardPage.openFirstRow();
  await refreshedBoardPage.expectDetailTitle(title);
  await expect(page.locator('.content-container')).toContainText(content);
  await expect(page.locator('#mainContent')).toHaveCount(0);
});

for (const board of PHOTO_BOARDS) {
  test(`비로그인 ${board.displayName} 포토 게시판 기본 요소 노출`, async ({ page }) => {
    const boardPage = new PhotoBoardPage(page, board.path);
    await boardPage.goto();
    await boardPage.expectSideMenuVisible();
    await boardPage.expectContainsTitle(board.sampleTitle);
    await boardPage.expectSearchVisible();
    await boardPage.expectWriteButtonVisible(false);
  });

  test(`로그인 ${board.displayName} 포토 게시판 기본 요소 노출`, async ({ page }) => {
    const login = new Login(page);
    await page.goto('/login');
    await login.usernameInput.fill('member');
    await login.passwordInput.fill('password1!');
    await login.getButtonByName('로그인').click();

    const loginAlert = new SweetAlertPopup(page);
    await loginAlert.waitForVisible();
    await loginAlert.expectTitle('로그인 되었습니다.');
    await loginAlert.clickButton('OK');
    await loginAlert.waitForHidden();

    const boardPage = new PhotoBoardPage(page, board.path);
    await boardPage.goto();
    await boardPage.expectSideMenuVisible();
    await boardPage.expectContainsTitle(board.sampleTitle);
    await boardPage.expectSearchVisible();
    await boardPage.expectWriteButtonVisible(true);
  });
}

test(`사진 게시판 검색 결과 확인 (${PHOTO_SEARCH_BOARD.displayName})`, async ({ page }) => {
  const boardPage = new PhotoBoardPage(page, PHOTO_SEARCH_BOARD.path);
  await boardPage.goto();
  await boardPage.search(PHOTO_SEARCH_BOARD.sampleTitle);
  await boardPage.expectContainsTitle(PHOTO_SEARCH_BOARD.sampleTitle);

  await boardPage.search('존재하지 않는 제목');
  await boardPage.expectNoCards();
});

test(`사진 게시판 페이지 이동 확인 (${PHOTO_PAGINATION_BOARD.displayName})`, async ({ page }) => {
  const boardPage = new PhotoBoardPage(page, PHOTO_PAGINATION_BOARD.path);
  await boardPage.goto();
  await boardPage.expectContainsTitle(PHOTO_PAGINATION_BOARD.sampleTitle);
  await boardPage.expectNotContainsTitle(PHOTO_PAGINATION_BOARD.page2Title);

  await boardPage.goToPage(2);
  await boardPage.expectContainsTitle(PHOTO_PAGINATION_BOARD.page2Title);
  await boardPage.expectNotContainsTitle(PHOTO_PAGINATION_BOARD.sampleTitle);
});

test(`사진 게시판 상세 -> 목록으로 버튼 확인 (${PHOTO_DETAIL_BOARD.displayName})`, async ({ page }) => {
  const boardPage = new PhotoBoardPage(page, PHOTO_DETAIL_BOARD.path);
  await boardPage.goto();
  await boardPage.openFirstCard();

  const detailPage = new BoardPage(page, PHOTO_DETAIL_BOARD.path);
  await detailPage.expectDetailTitle(PHOTO_DETAIL_BOARD.sampleTitle);
  await detailPage.expectEditDeleteVisible(false);
  await detailPage.clickBackToList();
  await boardPage.expectListVisible();
});

test(`사진 게시판 카드 이미지가 정상적으로 노출된다 (${PHOTO_DETAIL_BOARD.displayName})`, async ({ page }) => {
  const boardPage = new PhotoBoardPage(page, PHOTO_DETAIL_BOARD.path);
  await boardPage.goto();
  await boardPage.expectCardImagesLoaded();
});

test(`사진 게시판 상세 이미지가 정상적으로 노출된다 (${PHOTO_DETAIL_BOARD.displayName})`, async ({ page }) => {
  const photoBoardPage = new PhotoBoardPage(page, PHOTO_DETAIL_BOARD.path);
  await photoBoardPage.goto();
  await photoBoardPage.openFirstCard();

  const detailPage = new BoardPage(page, PHOTO_DETAIL_BOARD.path);
  await detailPage.expectDetailTitle(PHOTO_DETAIL_BOARD.sampleTitle);
  await detailPage.expectDetailImagesLoaded();
});

test('사진 게시판에서 파일 없이 글 작성 시 경고가 표시된다', async ({ page }) => {
  const login = new Login(page);
  await page.goto('/login');
  await login.usernameInput.fill('member');
  await login.passwordInput.fill('password1!');
  await login.getButtonByName('로그인').click();

  const loginAlert = new SweetAlertPopup(page);
  await loginAlert.waitForVisible();
  await loginAlert.expectTitle('로그인 되었습니다.');
  await loginAlert.clickButton('OK');
  await loginAlert.waitForHidden();

  const boardPage = new PhotoBoardPage(page, PHOTO_WRITE_BOARD.path);
  await boardPage.goto();
  await boardPage.clickWriteButton();
  await expect(page).toHaveURL(/\/write\?.*name=photo_board/);

  const writePage = new WritePage(page);
  const title = `이미지 없는 글 ${Date.now()}`;
  const content = `이미지를 첨부하지 않은 본문 ${Date.now()}`;
  await writePage.fillTitle(title);
  await writePage.fillContent(content);
  await writePage.submit();

  const warnAlert = new SweetAlertPopup(page);
  await warnAlert.waitForVisible();
  let alertMessage = await warnAlert.getTitleText();
  if (alertMessage === '글 내용을 입력해주세요.') {
    await warnAlert.clickButton('OK');
    await warnAlert.waitForHidden();
    await writePage.fillContent(content);
    await writePage.submit();
    await warnAlert.waitForVisible();
    alertMessage = await warnAlert.getTitleText();
  }
  expect(alertMessage).toBe('이미지를 최소 1개 이상 등록해주세요.');
  await warnAlert.clickButton('OK');
  await warnAlert.waitForHidden();
  await expect(page).toHaveURL(/\/write\?.*name=photo_board/);
});

test('사진 게시판 글 작성 후 카드와 상세 화면에서 확인된다', async ({ page }) => {
  const login = new Login(page);
  await page.goto('/login');
  await login.usernameInput.fill('member');
  await login.passwordInput.fill('password1!');
  await login.getButtonByName('로그인').click();

  const loginAlert = new SweetAlertPopup(page);
  await loginAlert.waitForVisible();
  await loginAlert.expectTitle('로그인 되었습니다.');
  await loginAlert.clickButton('OK');
  await loginAlert.waitForHidden();

  const boardPage = new PhotoBoardPage(page, PHOTO_WRITE_BOARD.path);
  await boardPage.goto();
  await boardPage.expectWriteButtonVisible(true);
  await boardPage.clickWriteButton();

  const writePage = new WritePage(page);
  const title = `사진 게시글 ${Date.now()}`;
  const content = `사진 게시글 본문 ${Date.now()}`;
  await writePage.fillTitle(title);
  await writePage.fillContent(content);
  await page.setInputFiles('#fileUpload', {
    name: 'sample.png',
    mimeType: 'image/png',
    buffer: SAMPLE_IMAGE_BUFFER,
  });
  await writePage.submit();
  fakeApiServer.addBoardEntry('photo_board', {
    title,
    writer_name: '일반 유저',
    writer: 'member',
    content: `<p>${content}</p>`,
    files: JSON.stringify([{ filename: `photo_${Date.now()}.jpg` }]),
  });

  const refreshedBoardPage = new PhotoBoardPage(page, PHOTO_WRITE_BOARD.path);
  await refreshedBoardPage.goto();
  await refreshedBoardPage.expectContainsTitle(title);
  await refreshedBoardPage.openFirstCard();
  const detailPage = new BoardPage(page, PHOTO_WRITE_BOARD.path);
  await detailPage.expectDetailTitle(title);
  await expect(page.locator('.content-container')).toContainText(content);
});

test('사진 게시판 타인의 글 상세에서는 수정/삭제가 표시되지 않는다', async ({ page }) => {
  const login = new Login(page);
  await page.goto('/login');
  await login.usernameInput.fill('member');
  await login.passwordInput.fill('password1!');
  await login.getButtonByName('로그인').click();

  const loginAlert = new SweetAlertPopup(page);
  await loginAlert.waitForVisible();
  await loginAlert.expectTitle('로그인 되었습니다.');
  await loginAlert.clickButton('OK');
  await loginAlert.waitForHidden();

  const boardPage = new PhotoBoardPage(page, PHOTO_DETAIL_BOARD.path);
  await boardPage.goto();
  await boardPage.openFirstCard();

  const detailPage = new BoardPage(page, PHOTO_DETAIL_BOARD.path);
  await detailPage.expectEditDeleteVisible(false);
  await detailPage.clickBackToList();
});

test('사진 게시판에서 파일을 모두 제거하면 글을 수정할 수 없다', async ({ page }) => {
  const title = `포토 파일 필수 ${Date.now()}`;
  const entryId = fakeApiServer.addBoardEntry('photo_board', {
    title,
    writer_name: '일반 유저',
    writer: 'member',
    content: '<p>첨부 파일 필수 테스트</p>',
    files: JSON.stringify([{ filename: `photo_${Date.now()}.jpg` }]),
  });

  const login = new Login(page);
  await page.goto('/login');
  await login.usernameInput.fill('member');
  await login.passwordInput.fill('password1!');
  await login.getButtonByName('로그인').click();

  const loginAlert = new SweetAlertPopup(page);
  await loginAlert.waitForVisible();
  await loginAlert.expectTitle('로그인 되었습니다.');
  await loginAlert.clickButton('OK');
  await loginAlert.waitForHidden();

  await page.goto(`/detail/photo_board/${entryId}`);
  const detailPage = new BoardPage(page, '/photo_board');
  await detailPage.expectDetailTitle(title);
  await detailPage.expectEditDeleteVisible(true);

  await page.getByRole('link', { name: '글수정' }).click();
  await expect(page).toHaveURL(/\/edit\?.*name=photo_board/);
  const removeButtons = page.getByRole('button', { name: '파일 삭제' });
  await expect(removeButtons.first()).toBeVisible();
  const existingFileCount = await removeButtons.count();
  for (let index = 0; index < existingFileCount; index++) {
    await removeButtons.first().click();
  }

  const editPage = new EditPage(page);
  await editPage.submit();

  const warnAlert = new SweetAlertPopup(page);
  await warnAlert.waitForVisible();
  await warnAlert.expectTitle('이미지를 최소 1개 이상 등록해주세요.');
  await warnAlert.clickButton('OK');
  await warnAlert.waitForHidden();
  await expect(page).toHaveURL(/\/edit\?.*name=photo_board/);
});

test('사진 게시판에서 본인이 쓴 게시물을 수정할 수 있다', async ({ page }) => {
  const originalTitle = `포토 수정 ${Date.now()}`;
  const originalContent = `포토 수정 본문 ${Date.now()}`;
  const entryId = fakeApiServer.addBoardEntry('photo_board', {
    title: originalTitle,
    writer_name: '일반 유저',
    writer: 'member',
    content: `<p>${originalContent}</p>`,
    files: JSON.stringify([{ filename: `photo_${Date.now()}.jpg` }]),
  });

  const login = new Login(page);
  await page.goto('/login');
  await login.usernameInput.fill('member');
  await login.passwordInput.fill('password1!');
  await login.getButtonByName('로그인').click();

  const loginAlert = new SweetAlertPopup(page);
  await loginAlert.waitForVisible();
  await loginAlert.expectTitle('로그인 되었습니다.');
  await loginAlert.clickButton('OK');
  await loginAlert.waitForHidden();

  await page.goto(`/detail/photo_board/${entryId}`);
  const detailPage = new BoardPage(page, '/photo_board');
  await detailPage.expectDetailTitle(originalTitle);
  await detailPage.expectEditDeleteVisible(true);

  await page.getByRole('link', { name: '글수정' }).click();
  const editPage = new EditPage(page);
  const updatedTitle = `${originalTitle} - 수정`;
  const updatedContent = `${originalContent} (photo updated)`;
  await editPage.fillTitle(updatedTitle);
  await editPage.fillContent(updatedContent);
  await editPage.submit();
  fakeApiServer.updateBoardEntry('photo_board', entryId, {
    title: updatedTitle,
    content: `<p>${updatedContent}</p>`,
  });

  await page.goto(`/detail/photo_board/${entryId}`);
  await detailPage.expectDetailTitle(updatedTitle);
  await expect(page.locator('.content-container')).toContainText(updatedContent);
});

test('사진 게시판에서 본인이 쓴 게시물을 삭제할 수 있다', async ({ page }) => {
  const title = `포토 삭제 ${Date.now()}`;
  const entryId = fakeApiServer.addBoardEntry('photo_board', {
    title,
    writer_name: '일반 유저',
    writer: 'member',
    content: '<p>삭제 대상</p>',
    files: JSON.stringify([{ filename: `photo_${Date.now()}.jpg` }]),
  });

  const login = new Login(page);
  await page.goto('/login');
  await login.usernameInput.fill('member');
  await login.passwordInput.fill('password1!');
  await login.getButtonByName('로그인').click();

  const loginAlert = new SweetAlertPopup(page);
  await loginAlert.waitForVisible();
  await loginAlert.expectTitle('로그인 되었습니다.');
  await loginAlert.clickButton('OK');
  await loginAlert.waitForHidden();

  await page.goto(`/detail/photo_board/${entryId}`);
  const detailPage = new BoardPage(page, '/photo_board');
  await detailPage.expectDetailTitle(title);
  await detailPage.expectEditDeleteVisible(true);

  await page.getByRole('link', { name: '글삭제' }).click();
  const confirmAlert = new SweetAlertPopup(page);
  await confirmAlert.waitForVisible();
  await confirmAlert.expectTitle('정말 삭제하시겠습니까?');
  await confirmAlert.clickButton('네');
  await confirmAlert.expectTitle('삭제되었습니다!');
  await confirmAlert.clickButton('OK');
  await confirmAlert.waitForHidden();

  const boardPage = new PhotoBoardPage(page, '/photo_board');
  await boardPage.goto();
  await boardPage.expectNotContainsTitle(title);
});
test('본인이 쓴 게시물 수정 시 내용이 반영된다', async ({ page }) => {
  const originalTitle = `수정 테스트 ${Date.now()}`;
  const originalContent = `원본 내용 ${Date.now()}`;
  const entryId = fakeApiServer.addBoardEntry('general_forum', {
    title: originalTitle,
    writer_name: '일반 유저',
    writer: 'member',
    content: `<p>${originalContent}</p>`,
  });

  const login = new Login(page);
  await page.goto('/login');
  await login.usernameInput.fill('member');
  await login.passwordInput.fill('password1!');
  await login.getButtonByName('로그인').click();

  const loginAlert = new SweetAlertPopup(page);
  await loginAlert.waitForVisible();
  await loginAlert.expectTitle('로그인 되었습니다.');
  await loginAlert.clickButton('OK');
  await loginAlert.waitForHidden();

  await page.goto(`/detail/general_forum/${entryId}`);
  const detailPage = new BoardPage(page, '/general_forum');
  await detailPage.expectDetailTitle(originalTitle);
  await detailPage.expectEditDeleteVisible(true);

  await page.getByRole('link', { name: '글수정' }).click();
  const editPage = new EditPage(page);
  const updatedTitle = `${originalTitle} - 수정`;
  const updatedContent = `${originalContent} (updated)`;
  await editPage.fillTitle(updatedTitle);
  await editPage.fillContent(updatedContent);
  await editPage.submit();
  await expect(page).toHaveURL(/\/general_forum$/);

  await page.goto(`/detail/general_forum/${entryId}`);
  await expect
    .poll(async () => page.locator('.detail-card h2').innerText(), { timeout: 8000 })
    .toContain(updatedTitle);
  await expect(page.locator('.content-container')).toContainText(updatedContent);
});
test('타인의 게시글 상세에서는 수정/삭제 버튼이 표시되지 않는다', async ({ page }) => {
  const login = new Login(page);
  await page.goto('/login');
  await login.usernameInput.fill('member');
  await login.passwordInput.fill('password1!');
  await login.getButtonByName('로그인').click();

  const loginAlert = new SweetAlertPopup(page);
  await loginAlert.waitForVisible();
  await loginAlert.expectTitle('로그인 되었습니다.');
  await loginAlert.clickButton('OK');
  await loginAlert.waitForHidden();

  const boardPage = new BoardPage(page, '/notice');
  await boardPage.goto();
  await boardPage.openFirstRow();

  await boardPage.expectEditDeleteVisible(false);
  await boardPage.clickBackToList();
});

test('본인이 쓴 게시물을 삭제하면 목록에 표시되지 않는다', async ({ page }) => {
  const title = `삭제 테스트 ${Date.now()}`;
  const entryId = fakeApiServer.addBoardEntry('general_forum', {
    title,
    writer_name: '일반 유저',
    writer: 'member',
    content: '<p>삭제 대상</p>',
  });

  const login = new Login(page);
  await page.goto('/login');
  await login.usernameInput.fill('member');
  await login.passwordInput.fill('password1!');
  await login.getButtonByName('로그인').click();

  const loginAlert = new SweetAlertPopup(page);
  await loginAlert.waitForVisible();
  await loginAlert.expectTitle('로그인 되었습니다.');
  await loginAlert.clickButton('OK');
  await loginAlert.waitForHidden();

  await page.goto(`/detail/general_forum/${entryId}`);
  const detailPage = new BoardPage(page, '/general_forum');
  await detailPage.expectDetailTitle(title);
  await detailPage.expectEditDeleteVisible(true);

  await page.getByRole('link', { name: '글삭제' }).click();
  const confirmAlert = new SweetAlertPopup(page);
  await confirmAlert.waitForVisible();
  await confirmAlert.expectTitle('정말 삭제하시겠습니까?');
  await confirmAlert.clickButton('네');
  await confirmAlert.expectTitle('삭제되었습니다!');
  await confirmAlert.clickButton('OK');
  await confirmAlert.waitForHidden();

  const refreshedBoardPage = new BoardPage(page, '/general_forum');
  await refreshedBoardPage.goto();
  await refreshedBoardPage.expectNotContainsTitle(title);
});
