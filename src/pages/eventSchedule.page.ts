import { expect, Locator, Page } from 'playwright/test';

export class EventSchedulePage {
  private readonly calendarRoot: Locator;
  private readonly manualForm: Locator;
  private readonly titleInput: Locator;
  private readonly dateInputs: Locator;
  private readonly colorButtons: Locator;
  private readonly registerButton: Locator;
  private readonly sampleButton: Locator;
  private readonly csvUploadButton: Locator;
  private readonly todayButton: Locator;
  private readonly prevButton: Locator;
  private readonly nextButton: Locator;
  private readonly toolbarTitle: Locator;
  private readonly eventTitles: Locator;

  constructor(private readonly page: Page) {
    this.calendarRoot = page.locator('.calendar-wrapper .fc');
    this.manualForm = page.locator('.manual-form');
    this.titleInput = page.getByPlaceholder(/(이벤트 제목|イベントタイトル)/);
    this.dateInputs = page.locator('.manual-form input[type="date"]');
    this.colorButtons = page.locator('.color-palette .color-swatch');
    this.registerButton = page.getByRole('button', {
      name: /(스케줄 등록|スケジュール登録)/,
    });
    this.sampleButton = page.getByRole('button', {
      name: /(CSV 샘플 다운로드|CSVサンプルダウンロード)/,
    });
    this.csvUploadButton = page.getByRole('button', {
      name: /(CSV 일괄등록|CSV一括登録)/,
    });
    this.todayButton = page.locator('.fc-today-button');
    this.prevButton = page.locator('.fc-prev-button');
    this.nextButton = page.locator('.fc-next-button');
    this.toolbarTitle = page.locator('.fc-toolbar-title');
    this.eventTitles = page.locator('.fc-event-title');
  }

  async goto() {
    await this.page.goto('/eventSchedule');
  }

  async expectCalendarVisible() {
    await expect(this.calendarRoot).toBeVisible();
  }

  async expectAdminFormVisible(visible: boolean) {
    if (visible) {
      await expect(this.manualForm).toBeVisible();
    } else {
      await expect(this.manualForm).toHaveCount(0);
    }
  }

  async expectEventCountAtLeast(minCount: number) {
    await expect
      .poll(async () => this.eventTitles.count(), {
        message: `Expected at least ${minCount} events to be visible`,
      })
      .toBeGreaterThan(minCount - 1);
  }

  async expectEventVisible(title: string) {
    await expect(this.eventTitles.filter({ hasText: title }).first()).toBeVisible();
  }

  async expectEventNotVisible(title: string) {
    await expect(this.eventTitles.filter({ hasText: title })).toHaveCount(0);
  }

  async getCurrentMonthLabel() {
    return (await this.toolbarTitle.innerText()).trim();
  }

  async expectCurrentMonthLabel(expected: string) {
    await expect(this.toolbarTitle).toHaveText(expected);
  }

  async expectMonthLabelNotToBe(text: string) {
    await expect(this.toolbarTitle).not.toHaveText(text);
  }

  async goToToday() {
    await this.todayButton.click();
  }

  async goToNextMonth() {
    await this.nextButton.click();
  }

  async goToPreviousMonth() {
    await this.prevButton.click();
  }

  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async fillStartDate(value: string) {
    await this.dateInputs.nth(0).fill(value);
  }

  async fillEndDate(value: string) {
    await this.dateInputs.nth(1).fill(value);
  }

  async selectColor(index = 0) {
    const button = this.colorButtons.nth(index);
    if (await button.count()) {
      await button.click();
    }
  }

  async clickRegisterButton() {
    await this.registerButton.click();
  }

  async clickSampleDownloadButton() {
    await this.sampleButton.click();
  }

  async clickCsvUploadButton() {
    await this.csvUploadButton.click();
  }

  async openEvent(title: string) {
    const event = this.eventTitles.filter({ hasText: title }).first();
    await expect(event).toBeVisible();
    await event.click();
  }
}
