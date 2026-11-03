const base = require('@playwright/test');
const pages = require('../pages');
const { ProductApi } = require('../api/ProductApi');
const { buildUser } = require('../utils/dataFactory');

/**
 * Custom fixtures:
 *  - one fixture per page object (homePage, catalogPage, cartPage, …)
 *  - productApi / inStockProducts / outOfStockProduct  -> live catalog data
 *  - workerUser + authPage -> a fresh account per worker; authPage signs it in for each test.
 */
const test = base.test.extend({
  // ---------- page objects ----------
  homePage: async ({ page }, use) => use(new pages.HomePage(page)),
  catalogPage: async ({ page }, use) => use(new pages.CatalogPage(page)),
  productPage: async ({ page }, use) => use(new pages.ProductPage(page)),
  cartPage: async ({ page }, use) => use(new pages.CartPage(page)),
  loginPage: async ({ page }, use) => use(new pages.LoginPage(page)),
  signupPage: async ({ page }, use) => use(new pages.SignupPage(page)),
  checkoutPage: async ({ page }, use) => use(new pages.CheckoutPage(page)),
  confirmationPage: async ({ page }, use) => use(new pages.OrderConfirmationPage(page)),
  ordersPage: async ({ page }, use) => use(new pages.OrdersPage(page)),
  navbar: async ({ page }, use) => use(new pages.NavBar(page)),

  // ---------- API / test data ----------
  productApi: async ({ request }, use) => use(new ProductApi(request)),

  inStockProducts: async ({ productApi }, use) => {
    const products = await productApi.inStock();
    if (products.length < 2) base.test.skip(true, 'Need at least 2 in-stock products on qademo.com');
    await use(products);
  },

  outOfStockProduct: async ({ productApi }, use) => {
    const [product] = await productApi.outOfStock();
    if (!product) base.test.skip(true, 'No out-of-stock product currently on qademo.com');
    await use(product);
  },

  // ---------- authentication ----------
  /**
   * One fresh account per worker, registered through the UI once.
   * Note: qademo.com rotates its refresh token, so a saved storageState goes stale after
   * the first use. Instead of reusing a snapshot, `authPage` signs in for every test.
   */
  workerUser: [
    async ({ browser }, use, workerInfo) => {
      const user = buildUser();
      const context = await browser.newContext({ baseURL: workerInfo.project.use.baseURL });
      const page = await context.newPage();
      const signup = new pages.SignupPage(page);
      await signup.open();
      await signup.signup(user);
      await new pages.NavBar(page).username.waitFor({ timeout: 30_000 });
      await context.close();
      await use(user);
    },
    { scope: 'worker' },
  ],

  /** The default `page`, signed in as `workerUser`, starting with an empty cart. */
  authPage: async ({ page, workerUser }, use) => {
    const login = new pages.LoginPage(page);
    await login.open();
    await login.login(workerUser.username, workerUser.password);
    await new pages.NavBar(page).username.waitFor();
    await new pages.CartPage(page).ensureEmpty();
    await use(page);
  },
});

module.exports = { test, expect: base.expect };
