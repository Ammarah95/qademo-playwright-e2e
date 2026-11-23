# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/checkout.spec.js >> Checkout (signed-in user) >> known defects >> invalid month (13/20) should show a field-level expiry error
- Location: tests/e2e/checkout.spec.js:111:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('main p.text-red-600')
Expected pattern: /expir/i
Received string:  "Unknown error"
Timeout: 3000ms

Call log:
  - Expect "toContainText" locator('main p.text-red-600') with timeout 3000ms
  - waiting for locator('main p.text-red-600')
    10 × locator resolved to <p class="text-red-600" data-testid="checkout-error-message">Unknown error</p>
       - unexpected value "Unknown error"

```

```yaml
- paragraph: Unknown error
```

# Test source

```ts
  20  |     cart = new pages.CartPage(page);
  21  |     checkout = new pages.CheckoutPage(page);
  22  | 
  23  |     await productPage.openBySlug(product.slug);
  24  |     await productPage.addToCart();
  25  |     await productPage.viewCart();
  26  |     await cart.proceedToCheckout();
  27  |     await expect(page).toHaveURL(/\/checkout$/);
  28  |     await expect(checkout.heading).toHaveText('Checkout');
  29  |   });
  30  | 
  31  |   test('E2E: place an order and see it in order history', { tag: ['@smoke', '@e2e'] }, async () => {
  32  |     const data = buildCheckoutData();
  33  |     await expect(checkout.placeOrderButton).toHaveText(`Place Order - ${formatPrice(product.price)}`);
  34  | 
  35  |     await checkout.completeCheckout(data);
  36  | 
  37  |     const confirmation = new pages.OrderConfirmationPage(page);
  38  |     await expect(page).toHaveURL(/\/orders\/\d+$/);
  39  |     await expect(confirmation.heading).toHaveText(messages.order.confirmed);
  40  |     await expect(confirmation.shippingName).toHaveText(`${data.shipping.firstName} ${data.shipping.lastName}`);
  41  |     await expect(confirmation.shippingAddress).toHaveText(data.shipping.address);
  42  |     await expect(page.getByText(`Paid with card ending in ${data.payment.cardNumber.slice(-4)}`)).toBeVisible();
  43  |     await expect(page.getByText(product.name, { exact: true })).toBeVisible();
  44  | 
  45  |     const orderId = await confirmation.orderId();
  46  |     expect(orderId).toMatch(/^\d+$/);
  47  | 
  48  |     // cart is emptied after a successful order
  49  |     await expect(confirmation.navbar.cartBadge).toBeHidden();
  50  | 
  51  |     // order appears in "My Orders"
  52  |     await confirmation.navbar.goToOrders();
  53  |     const orders = new pages.OrdersPage(page);
  54  |     const order = orders.order(orderId);
  55  |     await expect(orders.heading).toHaveText('My Orders');
  56  |     await expect(order.number).toHaveText(`Order #${orderId}`);
  57  |     await expect(order.total).toHaveText(formatPrice(product.price));
  58  |     await expect(order.customer).toHaveText(`${data.shipping.firstName} ${data.shipping.lastName}`);
  59  |   });
  60  | 
  61  |   test('order with quantity 2 charges the correct total', { tag: ['@regression', '@e2e'] }, async () => {
  62  |     await checkout.backToCart.click();
  63  |     await cart.increaseQuantity(product.id);
  64  |     await cart.proceedToCheckout();
  65  | 
  66  |     const expected = formatPrice(sumPrices(product.price, product.price));
  67  |     await expect(checkout.placeOrderButton).toHaveText(`Place Order - ${expected}`);
  68  |     await checkout.completeCheckout(buildCheckoutData());
  69  | 
  70  |     await expect(page).toHaveURL(/\/orders\/\d+$/);
  71  |     await expect(page.getByText(`${formatPrice(product.price)} × 2`)).toBeVisible();
  72  |   });
  73  | 
  74  |   test('empty form shows all required-field errors', { tag: '@regression' }, async () => {
  75  |     await checkout.placeOrder();
  76  |     await expect(checkout.fieldErrors()).toHaveText([
  77  |       messages.checkout.firstNameRequired,
  78  |       messages.checkout.lastNameRequired,
  79  |       messages.checkout.addressRequired,
  80  |       messages.checkout.cardRequired,
  81  |       messages.checkout.expiryRequired,
  82  |       messages.checkout.cvvRequired,
  83  |       messages.checkout.nameRequired,
  84  |     ]);
  85  |     await expect(page).toHaveURL(/\/checkout$/);
  86  |   });
  87  | 
  88  |   test('invalid card number and CVV are rejected', { tag: '@regression' }, async () => {
  89  |     await checkout.completeCheckout(buildCheckoutData({ payment: { cardNumber: '1234', cvv: '1' } }));
  90  |     await expect(checkout.fieldErrors()).toContainText([messages.checkout.invalidCard, messages.checkout.invalidCvv]);
  91  |     await expect(page).toHaveURL(/\/checkout$/);
  92  |   });
  93  | 
  94  |   test.describe('known defects', { tag: '@known-defect' }, () => {
  95  |     // These document real bugs found while building the suite (3 Nov 2026).
  96  |     // test.fail() keeps the pipeline green while the bug exists and turns red the day it is fixed,
  97  |     // so the assertion can be promoted to a normal regression test.
  98  | 
  99  |     test('expired card (12/20) should be rejected', async () => {
  100 |       test.info().annotations.push({
  101 |         type: 'known defect',
  102 |         description: 'BUG-01: an expired card (expiry 12/20) is accepted and the order is placed.',
  103 |       });
  104 |       test.fail(true, 'BUG-01: expired cards are accepted');
  105 | 
  106 |       await checkout.completeCheckout(buildCheckoutData({ payment: { expiry: '12/20' } }));
  107 |       await expect(page).toHaveURL(/\/checkout$/, { timeout: 5_000 });
  108 |       await expect(checkout.fieldErrors()).toContainText(/expir/i, { timeout: 3_000 });
  109 |     });
  110 | 
  111 |     test('invalid month (13/20) should show a field-level expiry error', async () => {
  112 |       test.info().annotations.push({
  113 |         type: 'known defect',
  114 |         description: 'BUG-02: expiry "13/20" is blocked, but only a generic "Unknown error" is shown – no field-level message.',
  115 |       });
  116 |       test.fail(true, 'BUG-02: generic "Unknown error" instead of an expiry validation message');
  117 | 
  118 |       await checkout.completeCheckout(buildCheckoutData({ payment: { expiry: '13/20' } }));
  119 |       await expect(page).toHaveURL(/\/checkout$/);
> 120 |       await expect(checkout.fieldErrors()).toContainText(/expir/i, { timeout: 3_000 });
      |                                            ^ Error: expect(locator).toContainText(expected) failed
  121 |     });
  122 |   });
  123 | 
  124 |   test('"Back to Cart" keeps cart contents', { tag: '@regression' }, async () => {
  125 |     await checkout.backToCart.click();
  126 |     await expect(page).toHaveURL(/\/cart$/);
  127 |     await expect(cart.item(product.id).name).toHaveText(product.name);
  128 |   });
  129 | });
  130 | 
```