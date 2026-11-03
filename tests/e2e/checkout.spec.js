const { test, expect } = require('../../src/fixtures/test-fixtures');
const pages = require('../../src/pages');
const { buildCheckoutData } = require('../../src/utils/dataFactory');
const { formatPrice, sumPrices } = require('../../src/utils/price');
const messages = require('../../src/data/messages');

/**
 * Checkout flows run as a signed-in user (worker-scoped account, see fixtures).
 * Every test starts from an empty cart, adds a product and lands on /checkout.
 */
test.describe('Checkout (signed-in user)', () => {
  /** @type {import('@playwright/test').Page} */
  let page;
  let checkout, cart, product;

  test.beforeEach(async ({ authPage, inStockProducts }) => {
    page = authPage;
    product = inStockProducts[0];
    const productPage = new pages.ProductPage(page);
    cart = new pages.CartPage(page);
    checkout = new pages.CheckoutPage(page);

    await productPage.openBySlug(product.slug);
    await productPage.addToCart();
    await productPage.viewCart();
    await cart.proceedToCheckout();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(checkout.heading).toHaveText('Checkout');
  });

  test('E2E: place an order and see it in order history', { tag: ['@smoke', '@e2e'] }, async () => {
    const data = buildCheckoutData();
    await expect(checkout.placeOrderButton).toHaveText(`Place Order - ${formatPrice(product.price)}`);

    await checkout.completeCheckout(data);

    const confirmation = new pages.OrderConfirmationPage(page);
    await expect(page).toHaveURL(/\/orders\/\d+$/);
    await expect(confirmation.heading).toHaveText(messages.order.confirmed);
    await expect(confirmation.shippingName).toHaveText(`${data.shipping.firstName} ${data.shipping.lastName}`);
    await expect(confirmation.shippingAddress).toHaveText(data.shipping.address);
    await expect(page.getByText(`Paid with card ending in ${data.payment.cardNumber.slice(-4)}`)).toBeVisible();
    await expect(page.getByText(product.name, { exact: true })).toBeVisible();

    const orderId = await confirmation.orderId();
    expect(orderId).toMatch(/^\d+$/);

    // cart is emptied after a successful order
    await expect(confirmation.navbar.cartBadge).toBeHidden();

    // order appears in "My Orders"
    await confirmation.navbar.goToOrders();
    const orders = new pages.OrdersPage(page);
    const order = orders.order(orderId);
    await expect(orders.heading).toHaveText('My Orders');
    await expect(order.number).toHaveText(`Order #${orderId}`);
    await expect(order.total).toHaveText(formatPrice(product.price));
    await expect(order.customer).toHaveText(`${data.shipping.firstName} ${data.shipping.lastName}`);
  });

  test('order with quantity 2 charges the correct total', { tag: ['@regression', '@e2e'] }, async () => {
    await checkout.backToCart.click();
    await cart.increaseQuantity(product.id);
    await cart.proceedToCheckout();

    const expected = formatPrice(sumPrices(product.price, product.price));
    await expect(checkout.placeOrderButton).toHaveText(`Place Order - ${expected}`);
    await checkout.completeCheckout(buildCheckoutData());

    await expect(page).toHaveURL(/\/orders\/\d+$/);
    await expect(page.getByText(`${formatPrice(product.price)} × 2`)).toBeVisible();
  });

  test('empty form shows all required-field errors', { tag: '@regression' }, async () => {
    await checkout.placeOrder();
    await expect(checkout.fieldErrors()).toHaveText([
      messages.checkout.firstNameRequired,
      messages.checkout.lastNameRequired,
      messages.checkout.addressRequired,
      messages.checkout.cardRequired,
      messages.checkout.expiryRequired,
      messages.checkout.cvvRequired,
      messages.checkout.nameRequired,
    ]);
    await expect(page).toHaveURL(/\/checkout$/);
  });

  test('invalid card number and CVV are rejected', { tag: '@regression' }, async () => {
    await checkout.completeCheckout(buildCheckoutData({ payment: { cardNumber: '1234', cvv: '1' } }));
    await expect(checkout.fieldErrors()).toContainText([messages.checkout.invalidCard, messages.checkout.invalidCvv]);
    await expect(page).toHaveURL(/\/checkout$/);
  });

  test.describe('known defects', { tag: '@known-defect' }, () => {
    // These document real bugs found while building the suite (3 Nov 2026).
    // test.fail() keeps the pipeline green while the bug exists and turns red the day it is fixed,
    // so the assertion can be promoted to a normal regression test.

    test('expired card (12/20) should be rejected', async () => {
      test.info().annotations.push({
        type: 'known defect',
        description: 'BUG-01: an expired card (expiry 12/20) is accepted and the order is placed.',
      });
      test.fail(true, 'BUG-01: expired cards are accepted');

      await checkout.completeCheckout(buildCheckoutData({ payment: { expiry: '12/20' } }));
      await expect(page).toHaveURL(/\/checkout$/, { timeout: 5_000 });
      await expect(checkout.fieldErrors()).toContainText(/expir/i, { timeout: 3_000 });
    });

    test('invalid month (13/20) should show a field-level expiry error', async () => {
      test.info().annotations.push({
        type: 'known defect',
        description: 'BUG-02: expiry "13/20" is blocked, but only a generic "Unknown error" is shown – no field-level message.',
      });
      test.fail(true, 'BUG-02: generic "Unknown error" instead of an expiry validation message');

      await checkout.completeCheckout(buildCheckoutData({ payment: { expiry: '13/20' } }));
      await expect(page).toHaveURL(/\/checkout$/);
      await expect(checkout.fieldErrors()).toContainText(/expir/i, { timeout: 3_000 });
    });
  });

  test('"Back to Cart" keeps cart contents', { tag: '@regression' }, async () => {
    await checkout.backToCart.click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(cart.item(product.id).name).toHaveText(product.name);
  });
});
