const { BasePage } = require('./BasePage');

/** /orders/:id – shown right after a successful checkout */
class OrderConfirmationPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/orders');
    this.root = page.getByTestId('order-confirmation-page');
    this.heading = page.getByTestId('order-confirmation-heading');
    this.orderNumber = page.getByTestId('order-confirmation-number');
    this.orderDate = page.getByTestId('order-confirmation-date');
    this.shippingName = page.getByTestId('order-shipping-name');
    this.shippingAddress = page.getByTestId('order-shipping-address');
    this.itemsHeading = page.getByTestId('order-items-heading');
  }

  /** @returns {Promise<string>} e.g. "4012" */
  async orderId() {
    const text = await this.orderNumber.innerText();
    return text.replace(/[^\d]/g, '');
  }
}

module.exports = { OrderConfirmationPage };
