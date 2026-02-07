import { Page, Locator } from 'playwright/test';

export class EditPage {
  private readonly titleInput: Locator;
  private readonly contentEditor: Locator;
  private readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.titleInput = page.locator('#title');
    this.contentEditor = page.locator('.ck-editor__editable[role="textbox"]').first();
    this.submitButton = page.getByRole('link', { name: '글수정' });
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
