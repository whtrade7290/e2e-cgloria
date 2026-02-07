import { SweetAlertPopup } from '@pages/sweetAlert.page';
import { test, expect } from 'playwright/test';
import { Navbar } from '@pages/navbar.page';
import { Login } from '@pages/login.page';
import { SignUpPage } from '@pages/signup.page';

test.beforeEach(async ({ page }) => {
  const navbar = new Navbar(page);
  await navbar.goToHome();
  await navbar.clickLogin();
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
  const login = new Login(page);
  const signUpLink = login.getLinkByName('会員登録');
  await expect(signUpLink).toBeVisible();
  await signUpLink.click();

  const signUpPage = new SignUpPage(page);
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const randomAccount = `newuser_${randomSuffix}`;
  const randomEmail = `${randomAccount}@example.com`;

  // Act
  await expect(page).toHaveURL(/\/signUp/);
  await signUpPage.register({
    account: randomAccount,
    password: 'password1!',
    email: randomEmail,
    name: '홍길동',
  });

  // Assert
  const alert = new SweetAlertPopup(page);
  await alert.waitForVisible();
  await alert.expectTitle(
    '会員登録の申請が完了しました。\n管理者の承認後に有効になりますので、少々お待ちください。',
  );
  await alert.clickButton('OK');
  await alert.waitForHidden();
});
