const { BasePage } = require('./BasePage');

/** /orders – order history of the signed-in user */
class OrdersPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/orders');
    this.root = page.getByTestId('orders-page');
    this.heading = page.getByTestId('orders-heading');
    this.welcome = page.getByTestId('orders-welcome');
    this.list = page.getByTestId('orders-list');
    this.continueShopping = page.getByTestId('continue-shopping-from-orders-button');
  }

  /** @param {string|number} orderId */
  order(orderId) {
    const p = this.page;
    return {
      root: p.getByTestId(`order-item-${orderId}`),
      link: p.getByTestId(`order-link-${orderId}`),
      number: p.getByTestId(`order-number-${orderId}`),
      total: p.getByTestId(`order-total-${orderId}`),
      customer: p.getByTestId(`order-customer-${orderId}`),
    };
  }
}

module.exports = { OrdersPage };
