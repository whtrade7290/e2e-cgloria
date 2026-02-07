import { Page, Locator, expect } from 'playwright/test';

export class WritePage {
  private readonly titleInput: Locator;
  private readonly contentEditor: Locator;
  private readonly mainContentToggle: Locator;
  private readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.titleInput = page.locator('#title');
    this.contentEditor = page.locator('.ck-editor__editable[role="textbox"]').first();
    this.mainContentToggle = page.locator('#mainContent');
    this.submitButton = page.getByRole('link', { name: '글작성' }).first();
  }

  async expectMainContentToggleVisible(visible: boolean) {
    if (visible) {
      await expect(this.mainContentToggle).toBeVisible();
    } else {
      await expect(this.mainContentToggle).toHaveCount(0);
    }
  }

  async fillTitle(value: string) {
    await this.titleInput.fill(value);
  }

  async fillContent(value: string) {
    await this.contentEditor.click();
    await this.contentEditor.fill(value);
  }

  async submit() {
    await this.submitButton.click();
  }
}
