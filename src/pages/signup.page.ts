import { Page, Locator } from 'playwright/test';

export interface SignUpFormData {
  account: string;
  password: string;
  email: string;
  name: string;
}

export class SignUpPage {
  constructor(private readonly page: Page) {}

  get accountInput(): Locator {
    return this.page.getByTestId('signup-username');
  }

  get passwordInput(): Locator {
    return this.page.getByTestId('signup-password');
  }

  get confirmPasswordInput(): Locator {
    return this.page.getByTestId('signup-password-confirm');
  }

  get emailInput(): Locator {
    return this.page.getByTestId('signup-email');
  }

  get nameInput(): Locator {
    return this.page.getByTestId('signup-name');
  }

  get submitButton(): Locator {
    return this.page.getByTestId('signup-submit');
  }

  async fillAccount(value: string) {
    await this.accountInput.fill(value);
    // focusout에서만 검증 로직이 실행되므로 blur 처리
    await this.accountInput.blur();
  }

  async fillPassword(value: string) {
    await this.passwordInput.fill(value);
    await this.passwordInput.blur();
    await this.confirmPasswordInput.fill(value);
    await this.confirmPasswordInput.blur();
  }

  async fillEmail(value: string) {
    await this.emailInput.fill(value);
    await this.emailInput.blur();
  }

  async fillName(value: string) {
    await this.nameInput.fill(value);
    await this.nameInput.blur();
  }

  async fillForm(data: SignUpFormData) {
    await this.fillAccount(data.account);
    await this.fillPassword(data.password);
    await this.fillEmail(data.email);
    await this.fillName(data.name);
  }

  async submit() {
    await this.submitButton.click();
  }

  async register(data: SignUpFormData) {
    await this.fillForm(data);
    await this.submit();
  }
}
