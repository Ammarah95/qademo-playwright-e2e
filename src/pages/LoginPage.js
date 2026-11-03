const { BasePage } = require('./BasePage');

/** /login */
class LoginPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/login');
    this.root = page.getByTestId('login-page');
    this.heading = page.getByTestId('login-heading');
    this.form = page.getByTestId('login-form');
    this.usernameInput = page.getByTestId('username-input');
    this.passwordInput = page.getByTestId('password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.errorMessage = page.getByTestId('login-error-message');
    this.googleButton = page.getByTestId('google-signin-button');
    this.signUpLink = page.getByTestId('sign-up-link');
    this.backToHomeLink = page.getByTestId('back-to-home-link');
  }

  /**
   * @param {string} usernameOrEmail
   * @param {string} password
   */
  async login(usernameOrEmail, password) {
    await this.usernameInput.fill(usernameOrEmail);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

module.exports = { LoginPage };
