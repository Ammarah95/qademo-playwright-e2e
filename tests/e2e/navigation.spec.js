const { test, expect } = require('../../src/fixtures/test-fixtures');

test.describe('Navigation & home page', () => {
  test('home page renders hero and featured products', { tag: '@smoke' }, async ({ homePage }) => {
    await homePage.open();
    await expect(homePage.heroHeading).toHaveText('Your Playground for Automated Testing');
    await expect(homePage.browseProductsButton).toBeVisible();
    await expect(homePage.productCards.first()).toBeVisible();
  });

  test('"Browse Products" opens the catalog', { tag: '@regression' }, async ({ homePage, catalogPage, page }) => {
    await homePage.open();
    await homePage.browseProducts();
    await expect(page).toHaveURL(/\/catalog$/);
    await expect(catalogPage.heading).toHaveText('Product Catalog');
  });

  test('navbar links route to the correct pages', { tag: '@smoke' }, async ({ homePage, navbar, page }) => {
    await homePage.open();

    await navbar.goToProducts();
    await expect(page).toHaveURL(/\/catalog$/);

    await navbar.goToCart();
    await expect(page).toHaveURL(/\/cart$/);

    await navbar.goToSignIn();
    await expect(page).toHaveURL(/\/login$/);

    await page.goBack();
    await navbar.goToSignUp();
    await expect(page).toHaveURL(/\/signup$/);

    await navbar.logo.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('guest sees Sign In / Sign Up and no user menu', { tag: '@regression' }, async ({ homePage, navbar }) => {
    await homePage.open();
    await expect(navbar.signInLink).toBeVisible();
    await expect(navbar.signUpLink).toBeVisible();
    await expect(navbar.userMenu).toBeHidden();
    await expect(navbar.cartBadge).toBeHidden();
  });

  test('unknown product slug shows "Product Not Found"', { tag: '@regression' }, async ({ productPage, page }) => {
    await productPage.openBySlug(`does-not-exist-${Date.now()}`);
    await expect(productPage.notFoundHeading).toHaveText('Product Not Found');
    await productPage.notFoundBackButton.click();
    await expect(page).toHaveURL(/\/catalog$/);
  });
});
