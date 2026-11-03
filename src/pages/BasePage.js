const { NavBar } = require('./components/NavBar');

/**
 * Base class for every page object.
 * Holds the shared Playwright `page`, the navbar component and common helpers.
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} path relative URL of the page (e.g. '/cart')
   */
  constructor(page, path = '/') {
    this.page = page;
    this.path = path;
    this.navbar = new NavBar(page);
    this.loadingSpinner = page.getByTestId('loading-spinner');
  }

  /** Navigate directly to this page and wait for the SPA to finish rendering. */
  async open() {
    await this.page.goto(this.path);
    await this.waitForLoaded();
    return this;
  }

  /** Waits until the global loading spinner is gone. */
  async waitForLoaded() {
    await this.loadingSpinner.waitFor({ state: 'hidden' }).catch(() => {});
  }

  async reload() {
    await this.page.reload();
    await this.waitForLoaded();
  }

  /**
   * Runs a UI action that mutates the cart and waits for the cart API call it triggers.
   * The app updates the UI optimistically and syncs to /api/cart in the background; navigating
   * before that request finishes lets the server state overwrite the local cart.
   * @param {() => Promise<unknown>} action
   */
  async withCartSync(action) {
    const synced = this.page
      .waitForResponse((r) => r.url().includes('/api/cart') && r.request().method() !== 'GET', { timeout: 10_000 })
      .catch(() => null);
    await action();
    await synced;
  }

  /** Field-level validation messages rendered under inputs (red helper text). */
  fieldErrors() {
    return this.page.locator('main p.text-red-600');
  }
}

module.exports = { BasePage };
