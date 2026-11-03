const { test, expect } = require('../../src/fixtures/test-fixtures');

/**
 * Responsive checks – run by the `mobile-chrome` project (Pixel 7 emulation).
 * On small screens the desktop nav links are hidden behind the hamburger menu.
 */
test.describe('Mobile layout', { tag: '@mobile' }, () => {
  test('desktop nav is hidden and the hamburger menu exposes navigation', async ({ catalogPage, navbar }) => {
    await catalogPage.open();
    await expect(navbar.productsLink).toBeHidden();
    await expect(navbar.mobileMenuButton).toBeVisible();

    await navbar.openMobileMenu();
    await expect(navbar.mobileMenuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(navbar.mobileProductsLink).toBeVisible();
    await expect(navbar.mobileCartLink).toBeVisible();
    await expect(navbar.mobileSignInLink).toBeVisible();
    await expect(navbar.mobileSignUpLink).toBeVisible();
  });

  test('catalog grid renders every product on a small screen', async ({ catalogPage }) => {
    await catalogPage.open();
    await expect(catalogPage.heading).toBeVisible();
    await expect(catalogPage.productCards).toHaveCount(await catalogPage.displayedProductCount());
  });

  test('mobile menu cart link reflects the cart count', async ({ catalogPage, navbar, inStockProducts, page }) => {
    const [first, second] = inStockProducts;
    await catalogPage.open();
    await catalogPage.addToCart(first.id);
    await catalogPage.addToCart(second.id);

    await navbar.openMobileMenu();
    await expect(navbar.mobileCartLink).toHaveText('Cart (2)');
    await navbar.mobileCartLink.click();
    await expect(page).toHaveURL(/\/cart$/);
  });

  test('add to cart from the product page works on mobile', async ({ productPage, cartPage, inStockProducts }) => {
    const [product] = inStockProducts;
    await productPage.openBySlug(product.slug);
    await productPage.addToCart();
    await expect(productPage.inCartButton).toHaveText('In Cart (1)');

    await productPage.viewCart();
    await expect(cartPage.item(product.id).name).toHaveText(product.name);
  });
});
