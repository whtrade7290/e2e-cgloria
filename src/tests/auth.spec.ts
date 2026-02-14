import { SweetAlertPopup } from '@pages/sweetAlert.page';
import { test, expect } from 'playwright/test';
import { Navbar } from '@pages/navbar.page';
import { Login } from '@pages/login.page';
import { SignUpPage } from '@pages/signup.page';
import { createFakeApiServer } from '../utils/fakeApiServer';

let fakeApiServer: ReturnType<typeof createFakeApiServer>;

test.beforeEach(async ({ page }) => {
  fakeApiServer = createFakeApiServer();
  // 각 테스트는 /login에서 시작하도록 통일
  await fakeApiServer.setup(page);
  await page.goto('/login');
});

// test('로그인 성공', async ({ page }) => {
//   // Arrange
//   const login = new Login(page);
//   const alert = new SweetAlertPopup(page);
//   const navbar = new Navbar(page);
//   const accountInput = login.getInputByPlaceholder('アカウント名を入力してください');
//   const passwordInput = login.getInputByPlaceholder('パスワードを入力してください');
//   const loginButton = login.getButtonByName('ログイン');

//   // Act
//   await accountInput.fill('admin');
//   await passwordInput.fill('0000');
//   await loginButton.click();
//   await alert.waitForVisible();
//   await alert.expectTitle('ログインできました。');
//   await alert.clickButton('OK');
//   await alert.waitForHidden();

//   // Assert
//   await expect(navbar.userGreeting()).toHaveText('우현 様');
//   await expect(navbar.myPageToggle()).toContainText('マイページ');
// });

test('회원가입 성공', async ({ page }) => {
  // Arrange
  const navbar = new Navbar(page);
  // 초기 진입 언어가 일본어라 한글 UI로 전환
  await navbar.switchToKorean();

  const login = new Login(page);
  const signUpLink = login.getLinkByName('회원가입');
  await expect(signUpLink).toBeVisible();
  await signUpLink.click();

  const signUpPage = new SignUpPage(page);
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const randomAccount = `newuser_${randomSuffix}`;
  const randomEmail = `${randomAccount}@example.com`;

  // Act
  await expect(page).toHaveURL(/\/signUp/);
  const newUser = {
    account: randomAccount,
    password: 'password1!',
    email: randomEmail,
    name: '홍길동',
  };
  fakeApiServer.queueSignUp(newUser);
  await signUpPage.register(newUser);

  // Assert
  const alert = new SweetAlertPopup(page);
  await alert.waitForVisible();
  await alert.expectTitle(
    '회원가입 신청이 완료 되었습니다.\n관리자 승인 후 활성화 되니\n조금만 기다려주세요.',
  );
  await alert.clickButton('OK');
  await alert.waitForHidden();
  await expect(page).toHaveURL(/\/$/);
});

test('회원가입 필수 항목 체크 에러', async ({ page }) => {
  // Arrange
  const navbar = new Navbar(page);
  await navbar.switchToKorean();

  const login = new Login(page);
  const signUpLink = login.getLinkByName('회원가입');
  await expect(signUpLink).toBeVisible();
  await signUpLink.click();

  const signUpPage = new SignUpPage(page);
  await expect(page).toHaveURL(/\/signUp/);

  // Act: 입력 조건을 충족하지 못한 상태에서 제출
  await signUpPage.fillAccount('abc'); // 최소 길이 미달
  await signUpPage.submit();

  // Assert
  const alert = new SweetAlertPopup(page);
  await alert.waitForVisible();
  await alert.expectTitle('입력하신 회원 정보를 다시 확인해주세요.');
  await alert.clickButton('OK');
  await alert.waitForHidden();
  await expect(page).toHaveURL(/\/signUp/);
});

test('승인 전 로그인 실패', async ({ page }) => {
  // Arrange
  const navbar = new Navbar(page);
  await navbar.switchToKorean();

  const login = new Login(page);
  const signUpLink = login.getLinkByName('회원가입');
  await expect(signUpLink).toBeVisible();
  await signUpLink.click();

  const signUpPage = new SignUpPage(page);
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const randomAccount = `pending_${randomSuffix}`;
  const password = 'password1!';
  const randomEmail = `${randomAccount}@example.com`;
  await expect(page).toHaveURL(/\/signUp/);

  const pendingUser = {
    account: randomAccount,
    password,
    email: randomEmail,
    name: '승인대기',
  };
  fakeApiServer.queueSignUp(pendingUser);
  await signUpPage.register(pendingUser);

  const successAlert = new SweetAlertPopup(page);
  await successAlert.waitForVisible();
  await successAlert.expectTitle(
    '회원가입 신청이 완료 되었습니다.\n관리자 승인 후 활성화 되니\n조금만 기다려주세요.',
  );
  await successAlert.clickButton('OK');
  await successAlert.waitForHidden();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/login');
  const accountInput = login.usernameInput;
  const passwordInput = login.passwordInput;
  const loginButton = login.getButtonByName('로그인');

  await accountInput.fill(randomAccount);
  await passwordInput.fill(password);
  await loginButton.click();

  const failAlert = new SweetAlertPopup(page);
  await failAlert.waitForVisible();
  await failAlert.expectTitle('로그인에 실패하였습니다.');
  await failAlert.clickButton('OK');
  await failAlert.waitForHidden();
  await expect(page).toHaveURL(/\/login/);
});

test('승인 후 로그인 성공', async ({ page }) => {
  const navbar = new Navbar(page);
  await navbar.switchToKorean();

  const login = new Login(page);
  const signUpLink = login.getLinkByName('회원가입');
  await expect(signUpLink).toBeVisible();
  await signUpLink.click();

  const signUpPage = new SignUpPage(page);
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const randomAccount = `approved_${randomSuffix}`;
  const password = 'password1!';
  const randomEmail = `${randomAccount}@example.com`;
  const newUser = {
    account: randomAccount,
    password,
    email: randomEmail,
    name: '승인완료',
  };
  await expect(page).toHaveURL(/\/signUp/);
  fakeApiServer.queueSignUp(newUser);
  await signUpPage.register(newUser);

  const signUpAlert = new SweetAlertPopup(page);
  await signUpAlert.waitForVisible();
  await signUpAlert.expectTitle(
    '회원가입 신청이 완료 되었습니다.\n관리자 승인 후 활성화 되니\n조금만 기다려주세요.',
  );
  await signUpAlert.clickButton('OK');
  await signUpAlert.waitForHidden();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/login');
  const loginButton = login.getButtonByName('로그인');
  await login.usernameInput.fill('admin');
  await login.passwordInput.fill('0000');
  await loginButton.click();

  const adminLoginAlert = new SweetAlertPopup(page);
  await adminLoginAlert.waitForVisible();
  await adminLoginAlert.expectTitle('로그인 되었습니다.');
  await adminLoginAlert.clickButton('OK');
  await adminLoginAlert.waitForHidden();
  await expect(page).toHaveURL(/\/$/);

  await navbar.openAdminMenu();
  await navbar.clickAdminMenuItem('회원가입 승인 페이지');

  const pendingRow = page.locator('table tbody tr').filter({ hasText: randomAccount });
  await expect(pendingRow).toHaveCount(1);
  await pendingRow.getByText('승인', { exact: true }).click();

  const approvalAlert = new SweetAlertPopup(page);
  await approvalAlert.waitForVisible();
  await approvalAlert.expectTitle('회원가입을 승인하시겠습니까?');
  await approvalAlert.clickButton('확인');
  await approvalAlert.expectTitle('승인되었습니다.');
  await approvalAlert.clickButton('OK');
  await approvalAlert.waitForHidden();
  await expect(pendingRow).toHaveCount(0);

  await navbar.logoutThroughMenu();
  const logoutAlert = new SweetAlertPopup(page);
  await logoutAlert.waitForVisible();
  await logoutAlert.expectTitle('로그아웃 하시겠습니까?');
  await logoutAlert.clickButton('OK');
  await logoutAlert.expectTitle('로그아웃 되었습니다.');
  await logoutAlert.clickButton('OK');
  await logoutAlert.waitForHidden();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/login');
  await login.usernameInput.fill(randomAccount);
  await login.passwordInput.fill(password);
  await loginButton.click();

  const userLoginAlert = new SweetAlertPopup(page);
  let alertSeen = true;
  try {
    await userLoginAlert.waitForVisible();
  } catch {
    alertSeen = false;
  }
  if (alertSeen) {
    await userLoginAlert.expectTitle('로그인 되었습니다.');
    await userLoginAlert.clickButton('OK');
    await userLoginAlert.waitForHidden();
  } else {
    await expect(navbar.userGreeting()).toContainText(`${newUser.name}`);
  }

  await expect(navbar.userGreeting()).toHaveText(`${newUser.name} 님`);
  await expect(navbar.myPageToggle()).toContainText('마이페이지');
});
