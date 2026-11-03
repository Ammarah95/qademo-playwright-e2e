const { BasePage } = require('./BasePage');

/** /checkout – shipping + payment form (requires authentication) */
class CheckoutPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/checkout');
    this.root = page.getByTestId('checkout-page');
    this.heading = page.getByTestId('checkout-heading');
    this.backToCart = page.getByTestId('back-to-cart-link');
    this.firstName = page.getByTestId('checkout-first-name');
    this.lastName = page.getByTestId('checkout-last-name');
    this.address = page.getByTestId('checkout-address');
    this.cardNumber = page.getByTestId('checkout-card-number');
    this.expiry = page.getByTestId('checkout-expiry');
    this.cvv = page.getByTestId('checkout-cvv');
    this.nameOnCard = page.getByTestId('checkout-cardholder-name');
    this.placeOrderButton = page.getByTestId('place-order-button');
  }

  /**
   * @param {{firstName?:string,lastName?:string,address?:string}} shipping
   */
  async fillShipping(shipping) {
    if (shipping.firstName !== undefined) await this.firstName.fill(shipping.firstName);
    if (shipping.lastName !== undefined) await this.lastName.fill(shipping.lastName);
    if (shipping.address !== undefined) await this.address.fill(shipping.address);
  }

  /**
   * @param {{cardNumber?:string,expiry?:string,cvv?:string,nameOnCard?:string}} payment
   */
  async fillPayment(payment) {
    if (payment.cardNumber !== undefined) await this.cardNumber.fill(payment.cardNumber);
    if (payment.expiry !== undefined) await this.expiry.fill(payment.expiry);
    if (payment.cvv !== undefined) await this.cvv.fill(payment.cvv);
    if (payment.nameOnCard !== undefined) await this.nameOnCard.fill(payment.nameOnCard);
  }

  async placeOrder() {
    await this.placeOrderButton.click();
  }

  /**
   * Full happy-path helper.
   * @param {{shipping: object, payment: object}} data
   */
  async completeCheckout({ shipping, payment }) {
    await this.fillShipping(shipping);
    await this.fillPayment(payment);
    await this.placeOrder();
  }
}

module.exports = { CheckoutPage };
