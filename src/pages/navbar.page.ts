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
    await this.container.waitFor({ state: 'visible' });
    const button = this.container.getByText('한국어');
    if ((await button.count()) === 0) return;
    await button.click();
    await this.alert.waitForVisible();
    await this.alert.expectTitle('한국어로 변경하시겠습니까?');
    await this.alert.clickButton('OK');
    await this.alert.waitForHidden();
  }

  async switchToJapanase() {
    await this.container.waitFor({ state: 'visible' });
    const button = this.container.getByText('日本語');
    if ((await button.count()) === 0) return;
    await button.click();
    await this.alert.waitForVisible();
    await this.alert.expectTitle('日本語に切り替えますか？');
    await this.alert.clickButton('OK');
    await this.alert.waitForHidden();
  }

  async openWithDiaryMenu() {
    await this.page.locator('#withDiaryDropdown').click({ force: true });
    const menuItem = this.page
      .locator('.dropdown-menu .dropdown-item', { hasText: /예수동행일기|イエス同行日記/ })
      .first();
    await menuItem.waitFor({ state: 'visible' });
    await menuItem.click({ force: true });
  }

  async openAdminMenu() {
    // 관리자 메뉴는 hover로 열리지만 테스트에서는 강제 클릭으로 펼친다
    await this.page.locator('#adminPageDropdown').click({ force: true });
  }

  async clickAdminMenuItem(label: string) {
    const item = this.page.locator('.dropdown-menu .dropdown-item', { hasText: label }).first();
    await item.waitFor({ state: 'visible' });
    await item.click();
  }

  private async openUserMenu() {
    await this.container.locator('.user-menu-toggle').click();
  }

  async logoutThroughMenu() {
    await this.openUserMenu();
    await this.page.locator('.user-menu-dropdown .dropdown-item', { hasText: '로그아웃' }).click();
    await this.alert.waitForVisible();
    await this.alert.expectTitle('로그아웃 하시겠습니까?');
    await this.alert.clickButton('OK');
    await this.alert.waitForVisible();
    await this.alert.expectTitle('로그아웃 되었습니다.');
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
