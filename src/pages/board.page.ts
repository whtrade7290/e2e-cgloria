import { Page, Locator, expect } from 'playwright/test';

/**
 * 게시판 화면 공통 동작을 캡슐화한 Page Object.
 */
export class BoardPage {
  private readonly tableBody: Locator;
  private readonly sideMenu: Locator;
  private readonly desktopSearchInput: Locator;
  private readonly desktopSearchButton: Locator;
  private readonly writeButton: Locator;
  private readonly editButton: Locator;
  private readonly deleteButton: Locator;

  constructor(private readonly page: Page, private readonly path: string) {
    this.tableBody = page.locator('.table-responsive table tbody');
    this.sideMenu = page.locator('.display-sideMenu');
    this.desktopSearchInput = page
      .locator('.d-flex.justify-content-center input[placeholder="search"]')
      .first();
    this.desktopSearchButton = page
      .locator('.d-flex.justify-content-center button', { hasText: '검색' })
      .first();
    this.writeButton = page.getByRole('link', { name: '글작성' });
    this.editButton = page.getByRole('link', { name: '글수정' });
    this.deleteButton = page.getByRole('link', { name: '글삭제' });
  }

  async goto(query?: Record<string, string | number>) {
    const url = new URL(this.path, 'http://localhost');
    if (query) {
      Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, String(value)));
    }
    await this.page.goto(`${url.pathname}${url.search}`);
  }

  async expectSideMenuVisible() {
    await expect(this.sideMenu).toBeVisible();
  }

  async expectContainsTitle(text: string) {
    await expect(this.tableBody).toContainText(text);
  }

  async expectNotContainsTitle(text: string) {
    await expect(this.tableBody).not.toContainText(text);
  }

  async expectSearchVisible() {
    await expect(this.desktopSearchInput).toBeVisible();
  }

  async expectWriteButtonVisible(visible: boolean) {
    if (visible) {
      await expect(this.writeButton).toBeVisible();
    } else {
      await expect(this.writeButton).toBeHidden();
    }
  }

  async clickWriteButton() {
    await this.writeButton.click();
  }

  async search(keyword: string) {
    await this.desktopSearchInput.fill(keyword);
    await this.desktopSearchButton.click();
  }

  async expectNoResultsMessage() {
    await expect(this.tableBody).toContainText('검색 결과가 없습니다.');
  }

  async goToPage(pageNumber: number) {
    await this.page
      .locator('.d-none.d-lg-block nav .page-link')
      .filter({ hasText: String(pageNumber) })
      .first()
      .click();
  }

  async openFirstRow() {
    await this.tableBody.locator('tr').first().locator('a').first().click();
  }

  async expectFirstRowTitle(text: string) {
    const titleCell = this.tableBody.locator('tr').first().locator('td').nth(1);
    await expect(titleCell).toContainText(text);
  }

  async expectFirstRowWriter(text: string) {
    const writerCell = this.tableBody.locator('tr').first().locator('td').nth(2);
    await expect(writerCell).toHaveText(text);
  }

  async expectFirstRowDateContains(text: string) {
    const dateCell = this.tableBody.locator('tr').first().locator('td').nth(3);
    await expect(dateCell).toContainText(text);
  }

  async expectDetailTitle(text: string) {
    await expect(this.page.locator('.detail-card h2')).toHaveText(text);
  }

  async expectDetailImagesLoaded() {
    const images = this.page.locator('.image-attachment-list img');
    const imageCount = await images.count();
    await expect(imageCount).toBeGreaterThan(0);
    for (let index = 0; index < imageCount; index++) {
      const image = images.nth(index);
      await expect(image).toBeVisible();
      await expect
        .poll(async () =>
          image.evaluate((node) => {
            const element = node as HTMLImageElement;
            return element.complete && element.naturalWidth > 0 && element.naturalHeight > 0;
          }),
        )
        .toBeTruthy();
    }
  }

  async clickBackToList() {
    await this.page.getByRole('link', { name: '목록으로' }).click();
  }

  async expectListVisible() {
    await expect(this.tableBody).toBeVisible();
  }

  async expectEditDeleteVisible(visible: boolean) {
    if (visible) {
      await expect(this.editButton).toBeVisible();
      await expect(this.deleteButton).toBeVisible();
    } else {
      await expect(this.editButton).toHaveCount(0);
      await expect(this.deleteButton).toHaveCount(0);
    }
  }
}
