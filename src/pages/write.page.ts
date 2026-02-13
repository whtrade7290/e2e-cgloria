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
    await this.contentEditor.waitFor({ state: 'visible' });
    await this.page.waitForFunction(() => {
      const editable = document.querySelector('.ck-editor__editable[role="textbox"]') as HTMLElement & {
        ckeditorInstance?: unknown;
      };
      return !!editable?.ckeditorInstance;
    });
    const updated = await this.page.evaluate((text) => {
      const editable = document.querySelector('.ck-editor__editable[role="textbox"]') as HTMLElement & {
        ckeditorInstance?: { setData: (data: string) => void };
      };
      const editor = editable?.ckeditorInstance;
      if (editor) {
        editor.setData(`<p>${text}</p>`);
        return true;
      }
      return false;
    }, value);
    if (!updated) {
      await this.contentEditor.click();
      await this.contentEditor.pressSequentially(value);
    }
    await expect(this.contentEditor).toContainText(value);
  }

  async submit() {
    await this.submitButton.click();
  }
}
