import { Page, Locator } from 'playwright/test';
import { SweetAlertPopup } from '@pages/sweetAlert.page';

export class Navbar {
  readonly page: Page;
  readonly container: Locator;
  readonly alert: SweetAlertPopup;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('.nav-btn-container');
    this.alert = new SweetAlertPopup(page);
  }

  async goToHome() {
    await this.page.goto('/');
  }

  async clickLogin() {
    await this.container.getByText('ログイン').click();
  }

  async switchToKorean() {
    await this.container.getByText('한국어').click();
    await this.alert.waitForVisible();
    await this.alert.expectTitle('한국어로 변경하시겠습니까?');
    await this.alert.clickButton('OK');
    await this.alert.waitForHidden();
  }

  async switchToJapanase() {
    await this.container.getByText('日本語').click();
    await this.alert.waitForVisible();
    await this.alert.expectTitle('日本語に切り替えますか？');
    await this.alert.clickButton('OK');
    await this.alert.waitForHidden();
  }

  getNavBtnContainer(): Locator {
    return this.container;
  }

  userGreeting(): Locator {
    return this.getNavBtnContainer().locator('.user-menu-wrapper .user-greeting');
  }

  myPageToggle(): Locator {
    return this.getNavBtnContainer().locator('.user-menu-wrapper .user-menu-toggle');
  }
}
