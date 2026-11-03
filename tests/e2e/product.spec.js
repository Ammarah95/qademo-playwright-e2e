const { test, expect } = require('../../src/fixtures/test-fixtures');
const { formatPrice } = require('../../src/utils/price');

test.describe('Product detail page', () => {
  test('shows name, price, description and stock from the API', { tag: '@smoke' }, async ({ productPage, inStockProducts, page }) => {
    const [product] = inStockProducts;
    await productPage.openBySlug(product.slug);

    await expect(productPage.name).toHaveText(product.name);
    await expect(productPage.price).toHaveText(formatPrice(product.price));
    if (product.description) {
      await expect(productPage.description).toHaveText(product.description);
    }
    await expect(productPage.image).toBeVisible();
    await expect(page.getByText(/\d+ in stock/)).toBeVisible();
    await expect(productPage.addToCartButton).toBeEnabled();
  });

  test('"Add to Cart" switches to "In Cart (1)" and offers "View Cart"', { tag: '@smoke' }, async ({ productPage, inStockProducts, page }) => {
    const [product] = inStockProducts;
    await productPage.openBySlug(product.slug);
    await productPage.addToCart();

    await expect(productPage.inCartButton).toHaveText('In Cart (1)');
    await expect(productPage.navbar.cartBadge).toHaveText('1');

    await productPage.viewCart();
    await expect(page).toHaveURL(/\/cart$/);
  });

  test('clicking "In Cart" removes the product again', { tag: '@regression' }, async ({ productPage, inStockProducts }) => {
    const [product] = inStockProducts;
    await productPage.openBySlug(product.slug);
    await productPage.addToCart();
    await expect(productPage.inCartButton).toBeVisible();

    await productPage.removeFromCart();
    await expect(productPage.addToCartButton).toBeVisible();
    await expect(productPage.navbar.cartBadge).toBeHidden();
  });

  test('out-of-stock product cannot be added to the cart', { tag: '@regression' }, async ({ productPage, outOfStockProduct }) => {
    await productPage.openBySlug(outOfStockProduct.slug);
    await expect(productPage.name).toHaveText(outOfStockProduct.name);
    await expect(productPage.addToCartButton).toBeDisabled();
  });

  test('"Back to Catalog" returns to the product list', { tag: '@regression' }, async ({ productPage, inStockProducts, page }) => {
    await productPage.openBySlug(inStockProducts[0].slug);
    await productPage.backToCatalog.click();
    await expect(page).toHaveURL(/\/catalog$/);
  });
});
