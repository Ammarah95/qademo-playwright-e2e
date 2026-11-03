const { test, expect } = require('../../src/fixtures/test-fixtures');
const { buildUser } = require('../../src/utils/dataFactory');
const messages = require('../../src/data/messages');

test.describe('Sign up', () => {
  test.beforeEach(async ({ signupPage }) => {
    await signupPage.open();
  });

  test('new user can register and is signed in', { tag: '@smoke' }, async ({ signupPage, navbar, page }) => {
    const user = buildUser();
    await signupPage.signup(user);

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(navbar.username).toHaveText(user.username);
    await expect(navbar.signInLink).toBeHidden();
  });

  test('empty form shows all required-field errors', { tag: '@regression' }, async ({ signupPage }) => {
    await signupPage.submit();
    const errors = signupPage.fieldErrors();
    await expect(errors).toContainText([
      messages.signup.emailRequired,
      messages.signup.phoneRequired,
      messages.signup.passwordRequired,
      messages.signup.confirmRequired,
    ]);
  });

  test('invalid email, short phone and weak password are rejected', { tag: '@regression' }, async ({ signupPage, page }) => {
    await signupPage.signup({ email: 'not-an-email', phone: '12', password: 'abc', confirmPassword: 'abd' });
    await expect(page).toHaveURL(/\/signup$/);
    const errors = signupPage.fieldErrors();
    await expect(errors).toContainText([
      messages.signup.invalidEmail,
      messages.signup.phoneTooShort,
      messages.signup.passwordTooShort,
      messages.signup.passwordsMismatch,
    ]);
  });

  test('password policy hints are shown while typing', { tag: '@regression' }, async ({ signupPage, page }) => {
    await signupPage.passwordInput.fill('abc');
    await expect(page.getByText('At least 8 characters')).toBeVisible();
    await expect(page.getByText('At least one uppercase letter (A-Z)')).toBeVisible();
    await expect(page.getByText('At least one number (0-9)')).toBeVisible();
  });

  test('registering an existing email shows an error', { tag: '@regression' }, async ({ signupPage, workerUser, page }) => {
    await signupPage.signup(buildUser({ email: workerUser.email }));
    await expect(page).toHaveURL(/\/signup$/);
    await expect(signupPage.errorMessage).toContainText(messages.signup.duplicateEmail);
  });

  test('"Sign In" link navigates to login', { tag: '@regression' }, async ({ signupPage, page }) => {
    await signupPage.signInLink.click();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('Sign in / sign out', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('registered user can sign in with username', { tag: '@smoke' }, async ({ loginPage, navbar, workerUser, page }) => {
    await loginPage.login(workerUser.username, workerUser.password);
    await expect(navbar.username).toHaveText(workerUser.username);
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test('registered user can sign in with email', { tag: '@regression' }, async ({ loginPage, navbar, workerUser }) => {
    await loginPage.login(workerUser.email, workerUser.password);
    await expect(navbar.username).toHaveText(workerUser.username);
  });

  test('wrong password shows "Invalid username or password"', { tag: '@smoke' }, async ({ loginPage, workerUser, page }) => {
    await loginPage.login(workerUser.username, 'Wrong-Passw0rd');
    await expect(loginPage.errorMessage).toHaveText(messages.login.invalidCredentials);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('unknown user shows "Invalid username or password"', { tag: '@regression' }, async ({ loginPage }) => {
    await loginPage.login(`ghost_${Date.now()}`, 'Whatever123');
    await expect(loginPage.errorMessage).toHaveText(messages.login.invalidCredentials);
  });

  test('empty submit keeps the user on the login page', { tag: '@regression' }, async ({ loginPage, navbar, page }) => {
    await loginPage.submitButton.click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(navbar.userMenu).toBeHidden();
  });

  test('signed-in user can log out', { tag: '@smoke' }, async ({ loginPage, navbar, workerUser, page }) => {
    await loginPage.login(workerUser.username, workerUser.password);
    await expect(navbar.username).toBeVisible();

    await navbar.logout();
    await expect(navbar.signInLink).toBeVisible();
    await expect(navbar.userMenu).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
  });
});
