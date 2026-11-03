const { test, expect } = require('../../src/fixtures/test-fixtures');
const { formatPrice } = require('../../src/utils/price');

test.describe('Product catalog', () => {
  test.beforeEach(async ({ catalogPage }) => {
    await catalogPage.open();
  });

  test('shows heading and product count that matches the grid', { tag: '@smoke' }, async ({ catalogPage }) => {
    await expect(catalogPage.heading).toHaveText('Product Catalog');
    const displayed = await catalogPage.displayedProductCount();
    await expect(catalogPage.productCards).toHaveCount(displayed);
  });

  test('catalog lists every active product returned by the API', { tag: '@regression' }, async ({ catalogPage, productApi }) => {
    const active = (await productApi.list()).filter((p) => p.isActive);
    await expect(catalogPage.productCards).toHaveCount(active.length);

    for (const product of active) {
      const card = catalogPage.card(product.id);
      await expect.soft(card.name, `name of #${product.id}`).toHaveText(product.name);
      await expect.soft(card.price, `price of #${product.id}`).toHaveText(formatPrice(product.price));
    }
  });

  test('out-of-stock products show a badge and a disabled "Add" button', { tag: '@regression' }, async ({ catalogPage, outOfStockProduct }) => {
    const card = catalogPage.card(outOfStockProduct.id);
    await expect(card.outOfStockBadge).toHaveText('Out of Stock');
    await expect(card.addToCart).toBeDisabled();
  });

  test('in-stock products have an enabled "Add" button', { tag: '@regression' }, async ({ catalogPage, inStockProducts }) => {
    for (const product of inStockProducts) {
      await expect.soft(catalogPage.card(product.id).addToCart).toBeEnabled();
    }
  });

  test('adding a product from the grid updates the cart badge', { tag: '@smoke' }, async ({ catalogPage, inStockProducts }) => {
    const [first, second] = inStockProducts;
    await catalogPage.addToCart(first.id);
    await expect(catalogPage.navbar.cartBadge).toHaveText('1');
    await catalogPage.addToCart(second.id);
    await expect(catalogPage.navbar.cartBadge).toHaveText('2');
    await expect(catalogPage.navbar.cartLink).toHaveAttribute('aria-label', 'Shopping cart with 2 items');
  });

  test('clicking a product card opens its detail page', { tag: '@regression' }, async ({ catalogPage, productPage, inStockProducts, page }) => {
    const [product] = inStockProducts;
    await catalogPage.openProduct(product.id);
    await expect(page).toHaveURL(new RegExp(`/products/${product.slug}$`));
    await expect(productPage.name).toHaveText(product.name);
  });
});
