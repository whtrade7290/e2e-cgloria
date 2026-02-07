import { Page, Locator } from 'playwright/test';

export class Login {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get usernameInput(): Locator {
    return this.page.locator('input[aria-describedby="email-addon"]');
  }

  get passwordInput(): Locator {
    return this.page.locator('input[aria-describedby="password-addon"]');
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
