const { BasePage } = require('./BasePage');

class HomePage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/');
    this.root = page.getByTestId('home-page');
    this.heroHeading = page.getByTestId('hero-heading');
    this.heroDescription = page.getByTestId('hero-description');
    this.browseProductsButton = page.getByTestId('browse-products-button');
    this.heroSignInButton = page.getByTestId('hero-signin-button');
    this.productCards = page.getByTestId(/^product-card-\d+$/);
  }

  async browseProducts() {
    await this.browseProductsButton.click();
  }
}

module.exports = { HomePage };
