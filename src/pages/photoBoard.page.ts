import { Page, Locator, expect } from 'playwright/test';

export class PhotoBoardPage {
  private readonly cards: Locator;
  private readonly sideMenu: Locator;
  private readonly searchInput: Locator;
  private readonly searchButton: Locator;
  private readonly writeButton: Locator;

  constructor(private readonly page: Page, private readonly path: string) {
    this.cards = page.locator('.card.card-plain');
    this.sideMenu = page.locator('.display-sideMenu');
    this.searchInput = page
      .locator('.d-none.d-lg-flex.justify-content-center input[placeholder="search"]')
      .first();
    this.searchButton = page
      .locator('.d-none.d-lg-flex.justify-content-center button', { hasText: '검색' })
      .first();
    this.writeButton = page.getByRole('link', { name: '글작성' });
  }

  async goto() {
    await this.page.goto(this.path);
  }

  async expectSideMenuVisible() {
    await expect(this.sideMenu).toBeVisible();
  }

  async expectContainsTitle(text: string) {
    await expect(this.cards.first()).toContainText(text);
  }

  async expectNotContainsTitle(text: string) {
    await expect(this.cards.first()).not.toContainText(text);
  }

  async expectNoCards() {
    await expect(this.cards).toHaveCount(0);
  }

  async expectSearchVisible() {
    await expect(this.searchInput).toBeVisible();
  }

  async expectWriteButtonVisible(visible: boolean) {
    if (visible) {
      await expect(this.writeButton).toBeVisible();
    } else {
      await expect(this.writeButton).toBeHidden();
    }
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchButton.click();
  }

  async goToPage(pageNumber: number) {
    await this.page
      .locator('.pagination .page-link')
      .filter({ hasText: String(pageNumber) })
      .first()
      .click();
  }

  async openFirstCard() {
    await this.cards.first().locator('a').first().click();
  }

  async clickWriteButton() {
    await this.writeButton.click();
  }

  async expectListVisible() {
    await expect(this.cards.first()).toBeVisible();
  }
}
