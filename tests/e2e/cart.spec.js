const { test, expect } = require('../../src/fixtures/test-fixtures');
const { formatPrice, sumPrices } = require('../../src/utils/price');
const messages = require('../../src/data/messages');

test.describe('Shopping cart (guest)', () => {
  test('empty cart shows empty state with "Continue Shopping"', { tag: '@smoke' }, async ({ cartPage, page }) => {
    await cartPage.open();
    await expect(cartPage.emptyHeading).toHaveText(messages.cart.empty);
    await cartPage.emptyContinueShopping.click();
    await expect(page).toHaveURL(/\/catalog$/);
  });

  test.describe('with items', () => {
    /** @type {{id:number,name:string,price:number,slug:string}[]} */
    let products;

    test.beforeEach(async ({ catalogPage, inStockProducts }) => {
      products = inStockProducts.slice(0, 2);
      await catalogPage.open();
      for (const p of products) await catalogPage.addToCart(p.id);
      await expect(catalogPage.navbar.cartBadge).toHaveText(String(products.length));
    });

    test('lists added items with correct name, price and totals', { tag: '@smoke' }, async ({ cartPage }) => {
      await cartPage.open();
      await expect(cartPage.itemCount).toHaveText(`${products.length} items in your cart`);
      await expect(cartPage.items).toHaveCount(products.length);

      for (const p of products) {
        const item = cartPage.item(p.id);
        await expect(item.name).toHaveText(p.name);
        await expect(item.price).toHaveText(formatPrice(p.price));
        await expect(item.quantity).toHaveText('1');
        await expect(item.subtotal).toHaveText(formatPrice(p.price));
      }

      const expectedTotal = formatPrice(sumPrices(...products.map((p) => p.price)));
      await expect(cartPage.subtotal).toHaveText(expectedTotal);
      await expect(cartPage.shipping).toHaveText('Free');
      await expect(cartPage.total).toHaveText(expectedTotal);
    });

    test('increasing quantity recalculates line subtotal and order total', { tag: '@regression' }, async ({ cartPage }) => {
      const [p1, p2] = products;
      await cartPage.open();
      await cartPage.increaseQuantity(p1.id, 2);

      await expect(cartPage.item(p1.id).quantity).toHaveText('3');
      await expect(cartPage.item(p1.id).subtotal).toHaveText(formatPrice(sumPrices(p1.price, p1.price, p1.price)));
      await expect(cartPage.total).toHaveText(formatPrice(sumPrices(p1.price * 3, p2.price)));
      await expect(cartPage.navbar.cartBadge).toHaveText('4');
    });

    test('decrease is disabled at quantity 1 and works above it', { tag: '@regression' }, async ({ cartPage }) => {
      const [p1] = products;
      await cartPage.open();
      await expect(cartPage.item(p1.id).decrease).toBeDisabled();

      await cartPage.increaseQuantity(p1.id);
      await expect(cartPage.item(p1.id).decrease).toBeEnabled();
      await cartPage.decreaseQuantity(p1.id);
      await expect(cartPage.item(p1.id).quantity).toHaveText('1');
      await expect(cartPage.item(p1.id).decrease).toBeDisabled();
    });

    test('removing an item updates the list and total', { tag: '@regression' }, async ({ cartPage }) => {
      const [p1, p2] = products;
      await cartPage.open();
      await cartPage.removeItem(p1.id);

      await expect(cartPage.item(p1.id).root).toBeHidden();
      await expect(cartPage.items).toHaveCount(1);
      await expect(cartPage.total).toHaveText(formatPrice(p2.price));
      await expect(cartPage.navbar.cartBadge).toHaveText('1');
    });

    test('"Clear Cart" empties the cart', { tag: '@regression' }, async ({ cartPage }) => {
      await cartPage.open();
      await cartPage.clearCart();
      await expect(cartPage.emptyHeading).toBeVisible();
      await expect(cartPage.navbar.cartBadge).toBeHidden();
    });

    test('cart persists after a page reload', { tag: '@regression' }, async ({ cartPage }) => {
      await cartPage.open();
      await cartPage.reload();
      await expect(cartPage.items).toHaveCount(products.length);
    });

    test('guest is redirected to login when proceeding to checkout', { tag: '@smoke' }, async ({ cartPage, loginPage, page }) => {
      await cartPage.open();
      await cartPage.proceedToCheckout();
      await expect(page).toHaveURL(/\/login/);
      await expect(loginPage.heading).toHaveText('Welcome Back');
    });
  });
});
