const { BasePage } = require('./BasePage');

/** /signup */
class SignupPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/signup');
    this.root = page.getByTestId('signup-page');
    this.heading = page.getByTestId('signup-heading');
    this.form = page.getByTestId('signup-form');
    this.emailInput = page.getByTestId('email-input');
    this.phoneInput = page.getByTestId('phone-input');
    this.usernameInput = page.getByTestId('username-input');
    this.passwordInput = page.getByTestId('password-input');
    this.confirmPasswordInput = page.getByTestId('confirm-password-input');
    this.submitButton = page.getByTestId('signup-submit-button');
    this.errorMessage = page.getByTestId('signup-error-message');
    this.signInLink = page.getByTestId('sign-in-link');
  }

  /**
   * Fills only the fields provided.
   * @param {{email?: string, phone?: string, username?: string, password?: string, confirmPassword?: string}} user
   */
  async fillForm(user) {
    if (user.email !== undefined) await this.emailInput.fill(user.email);
    if (user.phone !== undefined) await this.phoneInput.fill(user.phone);
    if (user.username !== undefined) await this.usernameInput.fill(user.username);
    if (user.password !== undefined) await this.passwordInput.fill(user.password);
    const confirm = user.confirmPassword ?? user.password;
    if (confirm !== undefined) await this.confirmPasswordInput.fill(confirm);
  }

  async submit() {
    await this.submitButton.click();
  }

  /** @param {Parameters<SignupPage['fillForm']>[0]} user */
  async signup(user) {
    await this.fillForm(user);
    await this.submit();
  }
}

module.exports = { SignupPage };
