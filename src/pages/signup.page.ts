import { Page, Locator } from 'playwright/test';

export interface SignUpFormData {
  account: string;
  password: string;
  email: string;
  name: string;
}

export class SignUpPage {
  constructor(private readonly page: Page) {}

  get avatarSelectButton(): Locator {
    return this.page.getByRole('button', { name: '画像を選択' });
  }

  get accountInput(): Locator {
    return this.page.getByPlaceholder('アカウント名を入力してください');
  }

  get passwordInputs(): Locator {
    return this.page.locator('input[type="password"]');
  }

  get emailInput(): Locator {
    return this.page.getByPlaceholder('メールアドレスを入力してください');
  }

  get nameInput(): Locator {
    return this.page.getByPlaceholder('名前を入力してください');
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: '会員登録' });
  }

  async fillAccount(value: string) {
    await this.accountInput.fill(value);
  }

  async fillPassword(value: string) {
    await this.passwordInputs.nth(0).fill(value);
    await this.passwordInputs.nth(1).fill(value);
  }

  async fillEmail(value: string) {
    await this.emailInput.fill(value);
  }

  async fillName(value: string) {
    await this.nameInput.fill(value);
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
