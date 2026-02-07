import { Page, Locator, expect } from 'playwright/test';

/**
 * SweetAlert2 팝업을 다루는 헬퍼 클래스.
 */
export class SweetAlertPopup {
  private readonly popup: Locator;
  private readonly title: Locator;
  private readonly actions: Locator;

  constructor(private readonly page: Page) {
    this.popup = page.locator('.swal2-popup');
    this.title = this.popup.locator('#swal2-title');
    this.actions = this.popup.locator('.swal2-actions');
  }

  async waitForVisible() {
    await expect(this.popup).toBeVisible();
  }

  async waitForHidden() {
    await expect(this.popup).toBeHidden();
  }

  async expectTitle(text: string) {
    await expect(this.title).toHaveText(text);
  }

  async clickButton(name: string) {
    await this.actions.getByRole('button', { name, exact: true }).click();
  }
}
