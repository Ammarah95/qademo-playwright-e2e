const { BasePage } = require('./BasePage');
const { parsePrice } = require('../utils/price');

/** /cart – shopping cart & order summary */
class CartPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/cart');
    this.root = page.getByTestId('cart-page');
    this.filledState = page.getByTestId('cart-heading');
    this.heading = page.getByTestId('cart-heading');
    this.itemCount = page.getByTestId('cart-item-count');
    this.clearCartButton = page.getByTestId('clear-cart-button');
    this.itemsList = page.getByTestId('cart-items-list');
    this.items = this.itemsList.getByTestId(/^cart-item-\d+$/);
    this.subtotal = page.getByTestId('order-subtotal');
    this.shipping = page.getByTestId('order-shipping');
    this.total = page.getByTestId('order-total');
    this.checkoutButton = page.getByTestId('proceed-to-checkout-button');
    this.continueShoppingButton = page.getByTestId('continue-shopping-link-button');

    // Empty-cart state
    this.emptyState = page.getByTestId('cart-empty-state');
    this.emptyHeading = page.getByTestId('cart-empty-heading');
    this.emptyContinueShopping = page.getByTestId('continue-shopping-button');
  }

  async open() {
    await super.open();
    await this.filledState.or(this.emptyHeading).waitFor();
    return this;
  }

  /** @param {number} productId */
  item(productId) {
    const p = this.page;
    return {
      root: p.getByTestId(`cart-item-${productId}`),
      name: p.getByTestId(`cart-item-name-${productId}`),
      price: p.getByTestId(`cart-item-price-${productId}`),
      quantity: p.getByTestId(`cart-item-quantity-${productId}`),
      increase: p.getByTestId(`cart-item-increase-${productId}`),
      decrease: p.getByTestId(`cart-item-decrease-${productId}`),
      remove: p.getByTestId(`cart-item-remove-${productId}`),
      subtotal: p.getByTestId(`cart-item-subtotal-${productId}`),
    };
  }

  /** @param {number} productId */
  async increaseQuantity(productId, times = 1) {
    for (let i = 0; i < times; i++) {
      const before = await this.quantityOf(productId);
      await this.withCartSync(() => this.item(productId).increase.click());
      await this.page
        .getByTestId(`cart-item-quantity-${productId}`)
        .filter({ hasText: String(before + 1) })
        .waitFor();
    }
  }

  /** @param {number} productId */
  async decreaseQuantity(productId) {
    await this.withCartSync(() => this.item(productId).decrease.click());
  }

  /** @param {number} productId */
  async removeItem(productId) {
    await this.withCartSync(() => this.item(productId).remove.click());
  }

  async clearCart() {
    await this.withCartSync(() => this.clearCartButton.click());
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }

  /** @param {number} productId */
  async quantityOf(productId) {
    return Number((await this.item(productId).quantity.innerText()).trim());
  }

  async totalAmount() {
    return parsePrice(await this.total.innerText());
  }

  async subtotalAmount() {
    return parsePrice(await this.subtotal.innerText());
  }

  /** Empties the cart if it has anything in it (used for test isolation). */
  async ensureEmpty() {
    await this.open();
    if (await this.clearCartButton.isVisible()) {
      await this.clearCart();
      await this.emptyHeading.waitFor();
    }
  }
}

module.exports = { CartPage };
