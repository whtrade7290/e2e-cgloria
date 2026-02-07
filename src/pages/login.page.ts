import { Page, Locator } from 'playwright/test';

export class Login {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  getInputByPlaceholder(placeHolder: string): Locator {
    return this.page.getByPlaceholder(placeHolder);
  }

  getButtonByName(name: string): Locator {
    return this.page.getByRole('button', { name });
  }

  getLinkByName(name: string): Locator {
    return this.page.getByRole('link', { name });
  }
}
